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
 * This file loads and resolves modules; `bindings.ts` follows a name through
 * them to its declaration.
 *
 * Parsed files are cached per worker by path and checked against their
 * modification time on every lookup, so an editor session sees edits. Nothing
 * is ever written to disk. Anything that cannot be resolved or parsed answers
 * `null`, and every caller treats that as "not Lit": accurate or silent.
 */

import { readFileSync, realpathSync, statSync } from "node:fs";
import { dirname, resolve } from "node:path";

import type { Program } from "oxc-parser";
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
