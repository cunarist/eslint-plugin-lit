/**
 * Glob helpers for the project listing: where a TypeScript `include`
 * pattern starts, and which folders a walk can prune.
 */

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
