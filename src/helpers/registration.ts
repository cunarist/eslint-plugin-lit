/**
 * Facts no single file can answer: which module registers a custom element
 * tag, and which modules the linted file runs.
 *
 * A custom element is usable wherever its defining module has run, so a
 * template can reach a tag through any transitive import, and a rule seeing one
 * file cannot tell a direct registration from a borrowed one. The Deno plugin
 * walked the TypeScript program for this; here the program is the project's
 * files, as its `tsconfig.json` selects them, plus every declaration file they
 * import from packages.
 *
 * A tag is registered by any of three means: a `customElements.define("tag",
 * …)` call, a `@customElement("tag")` decorator, or an `HTMLElementTagNameMap`
 * augmentation mapping `"tag"` to its class. The first two name the
 * registering module directly; the augmentation is followed to the mapped
 * class's declaration. Compiled dependencies keep only the augmentation in
 * their `.d.ts`, so all three are needed to cover source and package elements.
 *
 * Both answers are memoized per worker and recomputed when a file they were
 * built from changes, or when the project gains or loses a file.
 */

import { existsSync, globSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";

import type {
  Argument,
  Class,
  Expression,
  Program,
  PropertyKey,
  Statement,
  TSInterfaceDeclaration,
} from "oxc-parser";
import { Visitor } from "oxc-parser";

import { isCustomElementDecorator } from "./identity.ts";
import type { ModuleFile } from "./modules.ts";
import { importedModule, loadModule, realPath, resolveLocal, resolveSpecifier } from "./modules.ts";

/** The interface an element module augments to type its tag. */
const TAG_NAME_MAP = "HTMLElementTagNameMap";

/** The global registry. */
const REGISTRY = "customElements";

/** The registry's registering method. */
const DEFINE = "define";

/** The file name of a folder's barrel, which stands for the whole folder. */
const BARREL = "index.ts";

/** The extensions of the files a project's program is made of. */
const SOURCE_EXTENSION: RegExp = /\.[cm]?ts$/u;

/** What TypeScript leaves out of a program when `exclude` is not set. */
const DEFAULT_EXCLUDE: readonly string[] = ["node_modules", "bower_components", "jspm_packages"];

/** A custom element name always contains a hyphen; built-in tags never do. */
function isCustomTag(tag: string | null): tag is string {
  return tag?.includes("-") === true;
}

/** The directory holding the nearest `tsconfig.json`, else `package.json`. */
export function projectRoot(fromPath: string): string | null {
  for (const marker of ["tsconfig.json", "package.json"]) {
    let directory = dirname(fromPath);
    while (true) {
      if (existsSync(join(directory, marker))) {
        return realPath(directory);
      }
      const parent = dirname(directory);
      if (parent === directory) {
        break;
      }
      directory = parent;
    }
  }
  return null;
}

/** The `include` and `exclude` lists of a `tsconfig.json`, if it has them. */
interface ProgramGlobs {
  include: string[];
  exclude: string[];
}

/** Strips comments and trailing commas, which `tsconfig.json` allows. */
function parseJsonc(text: string): unknown {
  const stripped = text
    .replaceAll(
      /("(?:[^"\\]|\\.)*")|\/\/[^\n]*|\/\*[\s\S]*?\*\//gu,
      (_match, string?: string) => string ?? "",
    )
    .replaceAll(/,(\s*[}\]])/gu, "$1");
  return JSON.parse(stripped);
}

/** A string list read from a parsed JSON object, or `null`. */
function stringList(object: unknown, key: string): string[] | null {
  if (typeof object !== "object" || object === null) {
    return null;
  }
  const value: unknown = Reflect.get(object, key);
  if (!Array.isArray(value)) {
    return null;
  }
  return value.filter((item): item is string => typeof item === "string");
}

/** The globs selecting a project's files, read from its `tsconfig.json`. */
function programGlobs(root: string): ProgramGlobs {
  let config: unknown = null;
  try {
    config = parseJsonc(readFileSync(join(root, "tsconfig.json"), "utf8"));
  } catch {
    config = null;
  }
  return {
    include: stringList(config, "include") ?? ["**/*"],
    exclude: stringList(config, "exclude") ?? [...DEFAULT_EXCLUDE],
  };
}

/** A glob for everything under a directory, when a pattern names one. */
function expandDirectory(pattern: string): string {
  return /[*?[{]/u.test(pattern) || SOURCE_EXTENSION.test(pattern) ? pattern : `${pattern}/**/*`;
}

/** The project's own source files, as TypeScript would select them. */
function projectFiles(root: string): string[] {
  const globs = programGlobs(root);
  const excluded = globs.exclude.map(expandDirectory);
  const files = globSync(globs.include.map(expandDirectory), {
    cwd: root,
    exclude: (path: string): boolean =>
      path.split(/[\\/]/u).some((segment) => DEFAULT_EXCLUDE.includes(segment)),
  });
  const skip = new Set(globSync(excluded, { cwd: root }));
  return files
    .filter((file) => SOURCE_EXTENSION.test(file) && !skip.has(file))
    .map((file) => realPath(join(root, file)))
    .toSorted();
}

/** The registering file of every tag, and what that answer was built from. */
interface RegistrationIndex {
  files: string[];
  versions: Map<string, number>;
  registrations: Map<string, string>;
}

/** The index of each project root, kept for the worker's lifetime. */
const indexes: Map<string, RegistrationIndex> = new Map();

/** A file's modification time, or `-1` when it is gone. */
function modified(path: string): number {
  try {
    return statSync(path).mtimeMs;
  } catch {
    return -1;
  }
}

/** Whether an index still describes the files it was built from. */
function isCurrent(index: RegistrationIndex, files: string[]): boolean {
  if (files.length !== index.files.length || files.some((file, at) => file !== index.files[at])) {
    return false;
  }
  for (const [path, version] of index.versions) {
    if (modified(path) !== version) {
      return false;
    }
  }
  return true;
}

/**
 * Where each custom element tag is registered, across the project the file at
 * `fromPath` belongs to: every tag mapped to the real path of the file that
 * registers it. The first registration seen wins.
 */
export function registrationIndex(fromPath: string): ReadonlyMap<string, string> {
  const root = projectRoot(fromPath);
  if (root === null) {
    return new Map();
  }
  const files = projectFiles(root);
  const existing = indexes.get(root);
  if (existing !== undefined && isCurrent(existing, files)) {
    return existing.registrations;
  }
  const built = buildIndex(files);
  indexes.set(root, built);
  return built.registrations;
}

/**
 * Collects every registration in the project's files and in the declaration
 * files they reach through imports, which is where packages declare theirs.
 */
function buildIndex(files: string[]): RegistrationIndex {
  const registrations = new Map<string, string>();
  const versions = new Map<string, number>();
  const pending = [...files];
  const queued = new Set(pending);
  for (let at = 0; at < pending.length; at += 1) {
    const path = pending[at];
    const module = path === undefined ? null : loadModule(path);
    if (path === undefined || module === null) {
      continue;
    }
    versions.set(path, modified(path));
    collectFromModule(module, registrations);
    for (const specifier of importSpecifiers(module.program)) {
      const target = resolveSpecifier(path, specifier);
      if (target !== null && !queued.has(target) && SOURCE_EXTENSION.test(target)) {
        queued.add(target);
        pending.push(target);
      }
    }
  }
  return { files, versions, registrations };
}

/** Every module specifier a file imports or re-exports from, types included. */
function importSpecifiers(program: Program): string[] {
  const specifiers: string[] = [];
  for (const statement of program.body) {
    if (
      statement.type === "ImportDeclaration" ||
      statement.type === "ExportAllDeclaration" ||
      (statement.type === "ExportNamedDeclaration" && statement.source !== null)
    ) {
      specifiers.push(statement.source?.value ?? "");
    }
  }
  return specifiers.filter((specifier) => specifier !== "");
}

/** Sets a tag against a file, keeping the first registration seen. */
function record(tag: string | null, file: string, registrations: Map<string, string>): void {
  if (isCustomTag(tag) && !registrations.has(tag)) {
    registrations.set(tag, file);
  }
}

/** Whether a file is a module, as opposed to a script whose names are global. */
function isModule(program: Program): boolean {
  return program.body.some(
    (statement) =>
      statement.type === "ImportDeclaration" ||
      statement.type === "ExportNamedDeclaration" ||
      statement.type === "ExportDefaultDeclaration" ||
      statement.type === "ExportAllDeclaration" ||
      statement.type === "TSExportAssignment",
  );
}

/** Whether a module binds a top-level name, by import or declaration, shadowing a global. */
function declaresTopLevel(module: ModuleFile, name: string): boolean {
  for (const statement of module.program.body) {
    if (statement.type === "ImportDeclaration") {
      if (statement.specifiers.some((specifier) => specifier.local.name === name)) {
        return true;
      }
    } else if (topLevelNames(statement).includes(name)) {
      return true;
    }
  }
  return false;
}

/** The names a top-level statement declares. */
function topLevelNames(raw: Program["body"][number]): string[] {
  const statement: Statement =
    raw.type === "ExportNamedDeclaration" && raw.declaration !== null ? raw.declaration : raw;
  switch (statement.type) {
    case "ClassDeclaration":
    case "FunctionDeclaration":
      return statement.id === null ? [] : [statement.id.name];
    case "VariableDeclaration":
      return statement.declarations.flatMap((declarator) =>
        declarator.id.type === "Identifier" ? [declarator.id.name] : [],
      );
    default:
      return [];
  }
}

/** The string literal key of a tag entry, or null for any other key. */
function memberTag(key: PropertyKey): string | null {
  return key.type === "Literal" && typeof key.value === "string" ? key.value : null;
}

/** Records every `"tag": ElementClass` entry against the class's own module. */
function recordAugmentation(
  module: ModuleFile,
  node: TSInterfaceDeclaration,
  registrations: Map<string, string>,
): void {
  for (const member of node.body.body) {
    if (member.type !== "TSPropertySignature" || member.typeAnnotation === null) {
      continue;
    }
    const tag = memberTag(member.key);
    const type = member.typeAnnotation.typeAnnotation;
    if (!isCustomTag(tag) || registrations.has(tag) || type.type !== "TSTypeReference") {
      continue;
    }
    const name = type.typeName;
    const binding = name.type === "Identifier" ? resolveLocal(module, name.name) : null;
    registrations.set(tag, binding?.kind === "declaration" ? binding.module.path : module.path);
  }
}

/** The global `HTMLElementTagNameMap` interfaces a file augments. */
function tagNameMaps(program: Program): TSInterfaceDeclaration[] {
  const found: TSInterfaceDeclaration[] = [];
  const global = !isModule(program);
  for (const statement of program.body) {
    if (statement.type === "TSInterfaceDeclaration" && global) {
      found.push(statement);
    }
    if (statement.type === "TSModuleDeclaration" && statement.kind === "global") {
      for (const inner of statement.body.body) {
        if (inner.type === "TSInterfaceDeclaration") {
          found.push(inner);
        }
      }
    }
  }
  return found.filter((node) => node.id.name === TAG_NAME_MAP);
}

/** Whether a decorator's callee is Lit's `customElement`, in a module. */
function isCustomElementIn(module: ModuleFile, callee: Expression): boolean {
  return (
    callee.type === "Identifier" && isCustomElementDecorator(resolveLocal(module, callee.name))
  );
}

/** The first argument of a call when it is a string literal. */
function literalArgument(argumentList: Argument[]): string | null {
  const first = argumentList[0];
  return first?.type === "Literal" && typeof first.value === "string" ? first.value : null;
}

/** Records every tag a file registers by any of the three means. */
function collectFromModule(module: ModuleFile, registrations: Map<string, string>): void {
  for (const node of tagNameMaps(module.program)) {
    recordAugmentation(module, node, registrations);
  }
  const registryIsGlobal = !declaresTopLevel(module, REGISTRY);
  const visitClass = (node: Class): void => {
    for (const decorator of node.decorators) {
      const call = decorator.expression;
      if (call.type === "CallExpression" && isCustomElementIn(module, call.callee)) {
        record(literalArgument(call.arguments), module.path, registrations);
      }
    }
  };
  new Visitor({
    ClassDeclaration: visitClass,
    ClassExpression: visitClass,
    CallExpression(node): void {
      const callee = node.callee;
      if (
        registryIsGlobal &&
        callee.type === "MemberExpression" &&
        !callee.computed &&
        callee.object.type === "Identifier" &&
        callee.object.name === REGISTRY &&
        callee.property.name === DEFINE
      ) {
        record(literalArgument(node.arguments), module.path, registrations);
      }
    },
  }).visit(module.program);
}

/** The directory a barrel covers, or null for any other file. */
function barrelScope(path: string): string | null {
  const cut = path.lastIndexOf("/");
  return path.slice(cut + 1) === BARREL ? path.slice(0, cut + 1) : null;
}

/** Whether an import executes its module rather than being fully erased. */
function runsImport(statement: Program["body"][number]): boolean {
  if (statement.type === "ImportDeclaration") {
    if (statement.importKind === "type") {
      return false;
    }
    const specifiers = statement.specifiers;
    return (
      specifiers.length === 0 ||
      specifiers.some(
        (specifier) => specifier.type !== "ImportSpecifier" || specifier.importKind !== "type",
      )
    );
  }
  if (statement.type === "ExportAllDeclaration") {
    return statement.exportKind !== "type";
  }
  if (statement.type === "ExportNamedDeclaration" && statement.source !== null) {
    return (
      statement.exportKind !== "type" &&
      (statement.specifiers.length === 0 ||
        statement.specifiers.some((specifier) => specifier.exportKind !== "type"))
    );
  }
  return false;
}

/** The module specifier of a statement that runs its module, else null. */
function runtimeSpecifier(statement: Program["body"][number]): string | null {
  if (!runsImport(statement)) {
    return null;
  }
  switch (statement.type) {
    case "ImportDeclaration":
    case "ExportAllDeclaration":
      return statement.source.value;
    case "ExportNamedDeclaration":
      return statement.source?.value ?? null;
    default:
      return null;
  }
}

/**
 * The files a module runs through its own runtime imports and re-exports, plus
 * the ones an imported barrel runs from inside its own directory tree.
 *
 * A barrel stands for the folder it sits in, so importing it is a real reason
 * for anything under that folder to have run. An arbitrary re-exporting file
 * is not: it can pull in a module from anywhere, which is the borrowed import
 * `require-direct-registration-import` exists to reject. Type-only imports and
 * re-exports are erased and never run their module, so they do not count.
 */
export function runtimeImportedFiles(module: ModuleFile): ReadonlySet<string> {
  const files = new Set<string>();
  const visited = new Set([module.path]);
  const pending: { module: ModuleFile; scope: string | null }[] = [{ module, scope: null }];
  for (let at = 0; at < pending.length; at += 1) {
    const current = pending[at];
    if (current === undefined) {
      continue;
    }
    for (const statement of current.module.program.body) {
      const specifier = runtimeSpecifier(statement);
      const imported = specifier === null ? null : importedModule(current.module.path, specifier);
      if (
        imported === null ||
        visited.has(imported.path) ||
        (current.scope !== null && !imported.path.startsWith(current.scope))
      ) {
        continue;
      }
      visited.add(imported.path);
      files.add(imported.path);
      const scope = barrelScope(imported.path);
      if (scope !== null) {
        pending.push({ module: imported, scope });
      }
    }
  }
  return files;
}
