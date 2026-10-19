/**
 * Following a name to its declaration: through imports, re-exports, and
 * `export *`, across the files `modules.ts` loads. Anything that cannot be
 * followed answers `null`.
 */

import type {
  Class,
  Declaration,
  ExportDefaultDeclaration,
  ExportNamedDeclaration,
  Function as FunctionNode,
  ModuleExportName,
  Program,
  Statement,
  VariableDeclarator,
} from "oxc-parser";

import { importedModule, type ModuleFile } from "./modules.ts";

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

/** One export name being looked up in one module. */
interface ExportLookup {
  module: ModuleFile;
  name: string;
  visited: Visited;
}

/**
 * A statement's answer for an export name: a binding, or `null`, when the
 * statement settles the name; `undefined` when it says nothing about it.
 */
type ExportAnswer = Binding | null | undefined;

/** What an `export const ...` or `export { ... }` statement says about the name. */
function namedExportAnswer(lookup: ExportLookup, statement: ExportNamedDeclaration): ExportAnswer {
  const { module, name, visited } = lookup;
  if (statement.declaration !== null) {
    const found = declaredNames(statement.declaration).find(([declared]) => declared === name);
    return found === undefined ? undefined : { kind: "declaration", module, node: found[1] };
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
  return undefined;
}

/** What an `export default ...` statement says about the name. */
function defaultExportAnswer(
  lookup: ExportLookup,
  statement: ExportDefaultDeclaration,
): ExportAnswer {
  if (lookup.name !== "default") {
    return undefined;
  }
  const declaration = statement.declaration;
  if (
    declaration.type === "ClassDeclaration" ||
    declaration.type === "ClassExpression" ||
    declaration.type === "FunctionDeclaration"
  ) {
    return { kind: "declaration", module: lookup.module, node: declaration };
  }
  if (declaration.type === "Identifier") {
    return resolveLocal(lookup.module, declaration.name, lookup.visited);
  }
  return null;
}

/**
 * What one top-level statement says about the name. An unnamed `export *`
 * says nothing yet: its source is collected into `starSources` instead.
 */
function statementAnswer(
  lookup: ExportLookup,
  statement: Program["body"][number],
  starSources: string[],
): ExportAnswer {
  switch (statement.type) {
    case "ExportNamedDeclaration":
      return namedExportAnswer(lookup, statement);
    case "ExportDefaultDeclaration":
      return defaultExportAnswer(lookup, statement);
    case "ExportAllDeclaration":
      if (statement.exported === null) {
        starSources.push(statement.source.value);
      } else if (exportName(statement.exported) === lookup.name) {
        return resolveImport(lookup.module.path, statement.source.value, "*", lookup.visited);
      }
      return undefined;
    default:
      return undefined;
  }
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
  const lookup: ExportLookup = { module, name, visited };
  const starSources: string[] = [];
  for (const statement of module.program.body) {
    const answer = statementAnswer(lookup, statement, starSources);
    if (answer !== undefined) {
      return answer;
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
