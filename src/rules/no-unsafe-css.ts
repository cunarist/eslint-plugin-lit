import type { TSESTree } from "@typescript-eslint/types";

import type { LitRule } from "#helpers";
import { docsUrl, keyName, LIT_CORE_SOURCES } from "#helpers";

/** The export this rule bans. */
const BANNED = "unsafeCSS";

/**
 * `no-unsafe-css` — bans `unsafeCSS` imported from Lit, both the import
 * specifier and every call site.
 *
 * `unsafeCSS` bypasses Lit's CSS sanitisation and lets arbitrary strings reach
 * the stylesheet.
 */
export const noUnsafeCssRule: LitRule = {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow `unsafeCSS` from Lit",
      url: docsUrl("no-unsafe-css"),
    },
    schema: [],
    messages: {
      imported:
        "Unexpected import of `unsafeCSS`, which defeats CSS sanitisation; write the rules in a `css` template.",
      call: "Unexpected `unsafeCSS(…)` call, which defeats CSS sanitisation; write the rules in a `css` template.",
    },
  },
  create(context) {
    /** Local names bound to `unsafeCSS` from Lit. */
    const locals = new Set<string>();
    return {
      ImportDeclaration(node: TSESTree.ImportDeclaration): void {
        if (!LIT_CORE_SOURCES.includes(node.source.value)) {
          return;
        }
        for (const specifier of node.specifiers) {
          if (specifier.type !== "ImportSpecifier" || keyName(specifier.imported) !== BANNED) {
            continue;
          }
          locals.add(specifier.local.name);
          context.report({ node: specifier, messageId: "imported" });
        }
      },
      CallExpression(node: TSESTree.CallExpression): void {
        if (node.callee.type === "Identifier" && locals.has(node.callee.name)) {
          context.report({ node, messageId: "call" });
        }
      },
    };
  },
};
