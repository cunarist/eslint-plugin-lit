/**
 * A project's own files, as its `tsconfig.json` selects them: the program the
 * registration index is built from. The root is the folder of the nearest
 * `tsconfig.json`, else `package.json`.
 *
 * The listing is walked once per project root and kept for the worker's
 * lifetime, so a lint run walks each project once however many files it lints.
 * It is checked by modification time on every lookup, so an editor or watch
 * session still sees files come and go: the walk records the `mtime` of
 * `tsconfig.json` and of every folder it read, and adding, removing, or
 * renaming an entry changes its folder's `mtime` (a listing that saw an `mtime`
 * too recent to trust is walked again). Folders whose files are all
 * excluded (`node_modules`, an `exclude`d `dist`) are pruned during the walk,
 * never read.
 */

import { type Dirent, existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, matchesGlob, posix } from "node:path";

import { excludedFolder, matchesDotSegments, patternBase } from "./globs.ts";
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
      /(?<string>"(?:[^"\\]|\\.)*")|\/\/[^\n]*|\/\*[\s\S]*?\*\//gu,
      (_match, string?: string) => string ?? "",
    )
    .replaceAll(/,(?<close>\s*[}\]])/gu, "$1");
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

/** A pattern in the form glob results are matched in: no `./`, no doubled `/`. */
function normalizePattern(pattern: string): string {
  return posix.normalize(expandDirectory(pattern));
}

/** Whether a path falls under a folder TypeScript always leaves out. */
function isDefaultExcluded(path: string): boolean {
  return path.split(/[\\/]/u).some((segment) => DEFAULT_EXCLUDE.includes(segment));
}

/** A file's or folder's modification time, or `-1` when it is gone. */
export function modified(path: string): number {
  try {
    return statSync(path).mtimeMs;
  } catch {
    return -1;
  }
}

/** A project's files, and the modification times that listing depends on. */
interface ProjectListing {
  files: string[];
  versions: Map<string, number>;
  /** Whether a folder changed so recently that a later change could share its `mtime`. */
  racy: boolean;
}

/**
 * How recent an `mtime` is too recent to trust, in milliseconds. File systems
 * stamp times from a coarse clock (FAT and exFAT every 2 s, HFS+ and ext3
 * every second), so a later change can share the `mtime` a walk saw; a
 * listing that saw a folder changed within one such tick is walked again next
 * time.
 */
const RACY_MS = 2000;

/** A walk in progress: every path seen relative to the root, and the versions read. */
interface Walk {
  root: string;
  seen: Set<string>;
  walked: Set<string>;
  versions: Map<string, number>;
  prune: (relative: string, name: string) => boolean;
}

/** Records a path's version, and its parents' up to the first that exists. */
function watchChain(walk: Walk, relative: string): void {
  let path = join(walk.root, relative);
  while (!walk.versions.has(path)) {
    const version = modified(path);
    walk.versions.set(path, version);
    const parent = dirname(path);
    if (version !== -1 || parent === path) {
      return;
    }
    path = parent;
  }
}

/** Collects every entry below a folder, skipping pruned folders and symlinks. */
function walkFolder(walk: Walk, relative: string): void {
  const absolute = join(walk.root, relative);
  if (walk.walked.has(relative)) {
    return;
  }
  walk.walked.add(relative);
  walk.versions.set(absolute, modified(absolute));
  let entries: Dirent[] | null = null;
  try {
    entries = readdirSync(absolute, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    const path = relative === "" ? entry.name : `${relative}/${entry.name}`;
    if (isDefaultExcluded(path)) {
      continue;
    }
    walk.seen.add(path);
    if (entry.isDirectory() && !walk.prune(path, entry.name)) {
      walkFolder(walk, path);
    }
  }
}

/** Walks a project's included folders, as TypeScript would select its files. */
function listProject(root: string): ProjectListing {
  const started = Date.now();
  const globs = programGlobs(root);
  const include = globs.include.map(normalizePattern);
  const exclude = globs.exclude.map(normalizePattern);
  const dotSafe = !include.some((pattern) => matchesDotSegments(pattern));
  const prunedFolders = new Set(
    dotSafe
      ? exclude.map((pattern) => excludedFolder(pattern)).filter((folder) => folder !== null)
      : [],
  );
  const walk: Walk = {
    root,
    seen: new Set(),
    walked: new Set(),
    versions: new Map([[join(root, "tsconfig.json"), modified(join(root, "tsconfig.json"))]]),
    prune: (path, name) => (dotSafe && name.startsWith(".")) || prunedFolders.has(path),
  };
  for (const pattern of include) {
    const { base, literal } = patternBase(pattern);
    if (literal) {
      watchChain(walk, dirname(base));
      if (!isDefaultExcluded(base) && modified(join(root, base)) !== -1) {
        walk.seen.add(base);
      }
    } else {
      watchChain(walk, base);
      walkFolder(walk, base);
    }
  }
  const files = [...walk.seen]
    .filter(
      (path) =>
        SOURCE_EXTENSION.test(path) &&
        include.some((pattern) => matchesGlob(path, pattern)) &&
        !exclude.some((pattern) => matchesGlob(path, pattern)),
    )
    .map((path) => realPath(join(root, path)))
    .toSorted();
  const racy = [...walk.versions.values()].some((version) => version > started - RACY_MS);
  return { files, versions: walk.versions, racy };
}

/** The listing of each project root, kept for the worker's lifetime. */
const listings = new Map<string, ProjectListing>();

/** Whether every file and folder a listing was walked from is unchanged. */
export function isUnchanged(versions: ReadonlyMap<string, number>): boolean {
  for (const [path, version] of versions) {
    if (modified(path) !== version) {
      return false;
    }
  }
  return true;
}

/**
 * The project's own source files, as TypeScript would select them. The same
 * array is returned for as long as the listing is current.
 */
export function projectFiles(root: string): readonly string[] {
  const cached = listings.get(root);
  if (cached !== undefined && !cached.racy && isUnchanged(cached.versions)) {
    return cached.files;
  }
  const listing = listProject(root);
  listings.set(root, listing);
  return listing.files;
}
