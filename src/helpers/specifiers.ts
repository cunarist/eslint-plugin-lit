/**
 * Lit's module specifiers, and the names a matching import binds.
 */

import type { TSESTree } from "@typescript-eslint/types";

/** Module specifiers that count as "the Lit core" for import checks. */
export const LIT_CORE_SOURCES: readonly string[] = ["lit", "lit-html", "lit-element"];

/** Legacy v1 specifiers that should be replaced by `lit`. */
export const LEGACY_LIT_SOURCES: readonly string[] = ["lit-html", "lit-element"];

/** The name an import specifier imports: `default`, `*`, or the export name. */
export function importedName(node: TSESTree.Node): string | null {
  switch (node.type) {
    case "ImportSpecifier":
      return node.imported.type === "Identifier" ? node.imported.name : node.imported.value;
    case "ImportDefaultSpecifier":
      return "default";
    case "ImportNamespaceSpecifier":
      return "*";
    default:
      return null;
  }
}

/**
 * The local name bound to a named import, when the module specifier matches.
 *
 * Rules that key on a bare call, `repeat(...)` or `createContext(...)`, must
 * confirm the name came from the module they mean. Without it the rule fires on
 * any unrelated function that happens to share the name.
 */
export function importedLocalName(
  node: TSESTree.ImportDeclaration,
  matchesSource: (source: string) => boolean,
  imported: string,
): string | null {
  if (!matchesSource(node.source.value)) {
    return null;
  }
  for (const specifier of node.specifiers) {
    // `import * as ns from "…"` binds every export under `ns.`.
    if (specifier.type === "ImportNamespaceSpecifier") {
      return `${specifier.local.name}.${imported}`;
    }
    if (specifier.type === "ImportSpecifier" && importedName(specifier) === imported) {
      return specifier.local.name;
    }
  }
  return null;
}

/** Matches Lit's `repeat` directive module in any of the three packages. */
const REPEAT_MODULE: RegExp = /^(?:lit|lit-html|lit-element)\/directives\/repeat\.js$/u;

/** Whether a specifier is Lit's `repeat` directive module. */
export function isRepeatModule(source: string): boolean {
  return REPEAT_MODULE.test(source);
}

/** Whether a specifier is the `@lit/context` package. */
export function isContextModule(source: string): boolean {
  return source === "@lit/context";
}
