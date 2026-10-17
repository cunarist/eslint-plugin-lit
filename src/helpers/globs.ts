/**
 * Glob matching for the project listing: TypeScript `include` and `exclude`
 * patterns, read as Node's `fs.glob` reads them, plus what a walk can prune.
 */

import { minimatch } from "minimatch";

/**
 * Whether a project-relative path matches a glob, as Node's `path.matchesGlob`
 * would decide (it wraps `minimatch` with these options). That export only
 * exists from Node 22.5, and the plugin supports every Node 22.
 */
export function matchesGlob(path: string, pattern: string): boolean {
  return minimatch(path, pattern, {
    nocase: process.platform === "darwin" || process.platform === "win32",
    nocaseMagicOnly: true,
    windowsPathsNoEscape: true,
    nonegate: true,
    nocomment: true,
    optimizationLevel: 2,
  });
}

/** Whether a path segment holds glob syntax rather than a literal name. */
function isMagic(segment: string): boolean {
  return /[*?[\]{}()!+@]/u.test(segment);
}

/** The literal folder a pattern starts in, before its first glob segment. */
export function patternBase(pattern: string): { base: string; literal: boolean } {
  const segments = pattern.split("/");
  const magic = segments.findIndex((segment) => isMagic(segment));
  if (magic === -1) {
    return { base: pattern, literal: true };
  }
  return { base: segments.slice(0, magic).join("/"), literal: false };
}

/**
 * Whether a pattern can match a path segment starting with `.`. Glob wildcards
 * never do, so without such a pattern a dot-folder holds nothing to find.
 */
export function matchesDotSegments(pattern: string): boolean {
  return pattern.split("/").some((segment) => segment !== ".." && /(?:^|[{,])\./u.test(segment));
}

/**
 * The folder under which an exclude pattern skips everything, or `null`: a
 * literal folder followed by `/**` or `/**\/*`.
 */
export function excludedFolder(pattern: string): string | null {
  const match = /^(.+?)\/\*\*(?:\/\*)?$/u.exec(pattern);
  const folder = match?.[1];
  return folder === undefined || folder.split("/").some((segment) => isMagic(segment))
    ? null
    : folder;
}
