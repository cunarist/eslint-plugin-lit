/**
 * Reading other files: the cross-file half of Lit detection.
 *
 * A lint rule sees one file. Whether `html` is Lit's, or whether a class's base
 * imported from another module extends `LitElement`, is decided by the
 * declaration the import finally points at, which lives in another file:
 * often a `.d.ts` inside `node_modules`. The Deno plugin asked the TypeScript
 * checker. This module answers the same questions without types, by following
 * imports and re-exports to the declaration itself:
 *
 * - `oxc-resolver` resolves a specifier the way TypeScript does for
 *   declarations, so `lit` lands on `lit/index.d.ts`, a `.js` specifier on its
 *   `.d.ts`, and package `imports` and tsconfig `paths` are honoured.
 * - `oxc-parser` parses the file it lands on.
 *
 * Parsed files are cached per worker by path and checked against their
 * modification time on every lookup, so an editor session sees edits. Nothing
 * is ever written to disk. Anything that cannot be resolved or parsed answers
 * `null`, and every caller treats that as "not Lit": accurate or silent.
 */

import { readFileSync, realpathSync, statSync } from "node:fs";
import { dirname, resolve } from "node:path";

import type {
  Class,
  Declaration,
  Function as FunctionNode,
  ModuleExportName,
  Program,
  Statement,
  VariableDeclarator,
} from "oxc-parser";
import { parseSync } from "oxc-parser";
import { ResolverFactory } from "oxc-resolver";

/** A parsed file. */
export interface ModuleFile {
  /** The file's real path, with forward slashes. */
  path: string;
  program: Program;
}

/** A parsed file, and the version of the file it was parsed from. */
interface CachedModule {
  mtimeMs: number;
  size: number;
  module: ModuleFile;
}

/** Every file parsed so far in this worker, by real path. */
const moduleCache: Map<string, CachedModule> = new Map();

/** Resolves module specifiers the way TypeScript resolves declarations. */
const resolver: ResolverFactory = new ResolverFactory({});

/** A path with forward slashes, so path patterns read the same on Windows. */
function slashed(path: string): string {
  return path.replaceAll("\\", "/");
}

/** The real path of a file, or the path itself when it does not exist. */
export function realPath(path: string): string {
  try {
    return slashed(realpathSync.native(path));
  } catch {
    return slashed(path);
  }
}

/** Parse source text as the file it claims to be. */
function parseModule(path: string, text: string): ModuleFile | null {
  try {
    const result = parseSync(path, text);
    return { path, program: result.program };
  } catch {
    return null;
  }
}

/** The parsed file at a path, reparsed when it changed since the last call. */
export function loadModule(path: string): ModuleFile | null {
  const real = realPath(path);
  let stat;
  try {
    stat = statSync(real);
  } catch {
    return null;
  }
  const cached = moduleCache.get(real);
  if (cached?.mtimeMs === stat.mtimeMs && cached.size === stat.size) {
    return cached.module;
  }
  let text: string;
  try {
    text = readFileSync(real, "utf8");
  } catch {
    return null;
  }
  const module = parseModule(real, text);
  if (module !== null) {
    moduleCache.set(real, { mtimeMs: stat.mtimeMs, size: stat.size, module });
  }
  return module;
}

/** The most recent parse of the file being linted, by path and text. */
interface CurrentModule {
  text: string;
  module: ModuleFile | null;
}

/** The file being linted, parsed from the text the host holds, not from disk. */
const currentModules: Map<string, CurrentModule> = new Map();

/**
 * The file being linted, parsed from its text in the host, which an editor
 * may not have saved yet.
 */
export function moduleFromText(path: string, text: string): ModuleFile | null {
  const real = realPath(path);
  const cached = currentModules.get(real);
  if (cached?.text === text) {
    return cached.module;
  }
  const module = parseModule(real, text);
  currentModules.set(real, { text, module });
  return module;
}

/** The real path a specifier resolves to from a file, or `null`. */
export function resolveSpecifier(fromPath: string, specifier: string): string | null {
  try {
    const result = resolver.resolveDtsSync(resolve(fromPath), specifier);
    return result.path === undefined ? null : realPath(result.path);
  } catch {
    return null;
  }
}

/** The parsed file a specifier resolves to from a file, or `null`. */
export function importedModule(fromPath: string, specifier: string): ModuleFile | null {
  const path = resolveSpecifier(fromPath, specifier);
  return path === null ? null : loadModule(path);
}

/** The directory of a module's file. */
export function moduleDirectory(module: ModuleFile): string {
  return slashed(dirname(module.path));
}

/** A declaration a name can finally point at. */
export type DeclarationNode = Class | FunctionNode | VariableDeclarator;

/** What a name resolves to: a declaration in some file, or a whole module. */
export type Binding =
  | { kind: "declaration"; module: ModuleFile; node: DeclarationNode }
  | { kind: "namespace"; module: ModuleFile };

/** What a local name is bound to before it is followed anywhere. */
type LocalBinding =
  | { kind: "declaration"; node: DeclarationNode }
  | { kind: "import"; source: string; imported: string };

/** The text of an import or export name, `default` and string names included. */
export function exportName(name: ModuleExportName): string {
  return name.type === "Literal" ? name.value : name.name;
}

/** The names a declaration statement declares, with their declarations. */
function declaredNames(declaration: Declaration): [string, DeclarationNode][] {
  switch (declaration.type) {
    case "ClassDeclaration":
    case "FunctionDeclaration":
    case "TSDeclareFunction":
      return declaration.id === null ? [] : [[declaration.id.name, declaration]];
    case "VariableDeclaration":
      return declaration.declarations.flatMap((declarator): [string, DeclarationNode][] =>
        declarator.id.type === "Identifier" ? [[declarator.id.name, declarator]] : [],
      );
    default:
      return [];
  }
}

/** A statement, with an `export` in front of a declaration looked through. */
function unwrapExport(statement: Program["body"][number]): Statement {
  if (statement.type === "ExportNamedDeclaration" && statement.declaration !== null) {
    return statement.declaration;
  }
  return statement;
}

/** What a top-level name in a module is bound to, or `null`. */
function localBinding(module: ModuleFile, name: string): LocalBinding | null {
  for (const raw of module.program.body) {
    const statement = unwrapExport(raw);
    if (statement.type === "ImportDeclaration") {
      for (const specifier of statement.specifiers) {
        if (specifier.local.name !== name) {
          continue;
        }
        const source = statement.source.value;
        switch (specifier.type) {
          case "ImportSpecifier":
            return { kind: "import", source, imported: exportName(specifier.imported) };
          case "ImportDefaultSpecifier":
            return { kind: "import", source, imported: "default" };
          default:
            return { kind: "import", source, imported: "*" };
        }
      }
      continue;
    }
    if (
      statement.type === "ExportDefaultDeclaration" &&
      (statement.declaration.type === "ClassDeclaration" ||
        statement.declaration.type === "FunctionDeclaration") &&
      statement.declaration.id?.name === name
    ) {
      return { kind: "declaration", node: statement.declaration };
    }
    if (isDeclaration(statement)) {
      const found = declaredNames(statement).find(([declared]) => declared === name);
      if (found !== undefined) {
        return { kind: "declaration", node: found[1] };
      }
    }
  }
  return null;
}

/** Whether a statement declares names. */
function isDeclaration(statement: Statement): statement is Declaration {
  switch (statement.type) {
    case "ClassDeclaration":
    case "FunctionDeclaration":
    case "TSDeclareFunction":
    case "VariableDeclaration":
      return true;
    default:
      return false;
  }
}

/** Files already visited while following one chain of re-exports. */
type Visited = Set<string>;

/** What a top-level name in a module finally points at, across files. */
export function resolveLocal(
  module: ModuleFile,
  name: string,
  visited: Visited = new Set(),
): Binding | null {
  const local = localBinding(module, name);
  if (local === null) {
    return null;
  }
  if (local.kind === "declaration") {
    return { kind: "declaration", module, node: local.node };
  }
  return resolveImport(module.path, local.source, local.imported, visited);
}

/**
 * What `import { imported } from "source"`, written in the file at `fromPath`,
 * finally points at. `imported` is `default` for a default import and `*` for
 * a namespace import.
 */
export function resolveImport(
  fromPath: string,
  source: string,
  imported: string,
  visited: Visited = new Set(),
): Binding | null {
  const target = importedModule(fromPath, source);
  if (target === null) {
    return null;
  }
  if (imported === "*") {
    return { kind: "namespace", module: target };
  }
  return resolveExport(target, imported, visited);
}

/** What a module's export `name` finally points at, across files. */
export function resolveExport(
  module: ModuleFile,
  name: string,
  visited: Visited = new Set(),
): Binding | null {
  const key = `${module.path}\n${name}`;
  if (visited.has(key)) {
    return null;
  }
  visited.add(key);
  const starSources: string[] = [];
  for (const statement of module.program.body) {
    switch (statement.type) {
      case "ExportNamedDeclaration": {
        if (statement.declaration !== null) {
          const found = declaredNames(statement.declaration).find(
            ([declared]) => declared === name,
          );
          if (found !== undefined) {
            return { kind: "declaration", module, node: found[1] };
          }
          break;
        }
        for (const specifier of statement.specifiers) {
          if (exportName(specifier.exported) !== name) {
            continue;
          }
          const local = exportName(specifier.local);
          return statement.source === null
            ? resolveLocal(module, local, visited)
            : resolveImport(module.path, statement.source.value, local, visited);
        }
        break;
      }
      case "ExportDefaultDeclaration": {
        if (name !== "default") {
          break;
        }
        const declaration = statement.declaration;
        if (
          declaration.type === "ClassDeclaration" ||
          declaration.type === "ClassExpression" ||
          declaration.type === "FunctionDeclaration"
        ) {
          return { kind: "declaration", module, node: declaration };
        }
        if (declaration.type === "Identifier") {
          return resolveLocal(module, declaration.name, visited);
        }
        return null;
      }
      case "ExportAllDeclaration": {
        if (statement.exported === null) {
          starSources.push(statement.source.value);
        } else if (exportName(statement.exported) === name) {
          return resolveImport(module.path, statement.source.value, "*", visited);
        }
        break;
      }
      default:
        break;
    }
  }
  if (name === "default") {
    return null;
  }
  for (const source of starSources) {
    const found = resolveImport(module.path, source, name, visited);
    if (found !== null) {
      return found;
    }
  }
  return null;
}

/** The name a declaration declares, or `null` for an anonymous one. */
export function declarationName(node: DeclarationNode): string | null {
  if (node.type === "VariableDeclarator") {
    return node.id.type === "Identifier" ? node.id.name : null;
  }
  return node.id?.name ?? null;
}
