/**
 * `project/no-asset-imports`, a repo-local rule of the `project` plugin in
 * `scripts/project-lint.ts`.
 *
 * @module
 */

import type { TSESTree } from "@typescript-eslint/types";

import type { ProjectRule } from "./project-lint-types.ts";

/** A module specifier read as a path: relative, absolute, or a `#` alias. */
const PATH_SPECIFIER_PATTERN: RegExp = /^[./#]/u;

/** The extensions a module may be imported by: `.ts` and package subpaths. */
const MODULE_EXTENSIONS: ReadonlySet<string> = new Set([".ts", ".js", ".mts", ".mjs"]);

/**
 * Whether `source` names an asset rather than a module: a query string such
 * as `?raw`, or a last path segment whose extension is not in
 * `MODULE_EXTENSIONS`. Bare package names and extensionless paths pass.
 */
function isAssetSource(source: string): boolean {
  if (source.includes("?")) {
    return true;
  }
  const segments: string[] = source.split("/");
  if (!PATH_SPECIFIER_PATTERN.test(source)) {
    const nameLength: number = source.startsWith("@") ? 2 : 1;
    if (segments.length <= nameLength) {
      return false;
    }
  }
  const lastSegment: string = segments.at(-1) ?? "";
  if (lastSegment === "." || lastSegment === ".." || !lastSegment.includes(".")) {
    return false;
  }
  return !MODULE_EXTENSIONS.has(lastSegment.slice(lastSegment.lastIndexOf(".")));
}

/**
 * `no-asset-imports` - rejects a static or literal dynamic import of anything
 * but a `.ts`, `.js`, `.mts`, or `.mjs` module (`.css`, `.json`, `.svg`,
 * `.tsx`, `?raw`, ...) and any import attributes. The non-`.ts` extensions
 * cover package subpaths such as `lit/decorators.js`.
 */
export const noAssetImportsRule: ProjectRule = {
  meta: {
    type: "problem",
    docs: { description: "Disallow importing CSS, JSON, SVG, and other non-module assets" },
    schema: [],
    messages: {
      extension: "Only .ts, .js, .mts and .mjs modules may be imported.",
      attributes: "Import attributes are not allowed.",
    },
  },
  create(context) {
    function checkSource(source: TSESTree.StringLiteral): void {
      if (isAssetSource(source.value)) {
        context.report({ node: source, messageId: "extension" });
      }
    }
    function checkDeclaration(
      node:
        | TSESTree.ImportDeclaration
        | TSESTree.ExportNamedDeclaration
        | TSESTree.ExportAllDeclaration,
    ): void {
      if (node.source === null) {
        return;
      }
      checkSource(node.source);
      if (node.attributes.length > 0) {
        context.report({ node, messageId: "attributes" });
      }
    }
    return {
      ImportDeclaration: checkDeclaration,
      ExportNamedDeclaration: checkDeclaration,
      ExportAllDeclaration: checkDeclaration,
      ImportExpression(node: TSESTree.ImportExpression): void {
        if (node.source.type === "Literal" && typeof node.source.value === "string") {
          checkSource(node.source);
        }
        if (node.options !== null) {
          context.report({ node, messageId: "attributes" });
        }
      },
    };
  },
};
