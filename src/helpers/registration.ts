/**
 * A fact no single file can answer: which module registers a custom element
 * tag. The files the linted file runs are in `runtime-imports.ts`, and the
 * project's own files in `project.ts`.
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
 * The answer is memoized per worker and recomputed when a file they were
 * built from changes, or when the project gains or loses a file.
 */

import { statSync } from "node:fs";

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

import { resolveLocal } from "./bindings.ts";
import { isCustomElementDecorator } from "./identity.ts";
import type { ModuleFile } from "./modules.ts";
import { loadModule, resolveSpecifier } from "./modules.ts";
import { projectFiles, projectRoot, SOURCE_EXTENSION } from "./project.ts";

/** The interface an element module augments to type its tag. */
const TAG_NAME_MAP = "HTMLElementTagNameMap";

/** The global registry. */
const REGISTRY = "customElements";

/** The registry's registering method. */
const DEFINE = "define";

/** A custom element name always contains a hyphen; built-in tags never do. */
function isCustomTag(tag: string | null): tag is string {
  return tag?.includes("-") === true;
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
