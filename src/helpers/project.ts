/**
 * A project's own files, as its `tsconfig.json` selects them: the program the
 * registration index is built from. The root is the folder of the nearest
 * `tsconfig.json`, else `package.json`.
 */

import { existsSync, globSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";

import { realPath } from "./modules.ts";

/** The extensions of the files a project's program is made of. */
export const SOURCE_EXTENSION: RegExp = /\.[cm]?ts$/u;

/** What TypeScript leaves out of a program when `exclude` is not set. */
const DEFAULT_EXCLUDE: readonly string[] = ["node_modules", "bower_components", "jspm_packages"];

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
export function projectFiles(root: string): string[] {
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
