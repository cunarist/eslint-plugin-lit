import type { TSESTree } from "@typescript-eslint/types";

import { docsUrl, keyName, type LitRule } from "#helpers";

/** Directive names that put an unparsed string into the DOM. */
const BANNED: ReadonlySet<string> = new Set(["unsafeHTML", "unsafeSVG"]);

/** Module specifiers that export the unsafe markup directives. */
const UNSAFE_SOURCES: ReadonlySet<string> = new Set([
  "lit/directives/unsafe-html.js",
  "lit/directives/unsafe-html",
  "lit/directives/unsafe-svg.js",
  "lit/directives/unsafe-svg",
  "lit-html/directives/unsafe-html.js",
  "lit-html/directives/unsafe-html",
  "lit-html/directives/unsafe-svg.js",
  "lit-html/directives/unsafe-svg",
]);

/**
 * `no-unsafe-html` — bans the `unsafeHTML` and `unsafeSVG` directives, both
 * the import specifier and every call site.
 *
 * Both parse a string as markup and insert it into the DOM, which is exactly
 * the injection sink Lit's normal bindings avoid.
 */
export const noUnsafeHtmlRule: LitRule = {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow the `unsafeHTML` and `unsafeSVG` directives",
      url: docsUrl("no-unsafe-html"),
    },
    schema: [],
    messages: {
      imported:
        "Unexpected import of `{{name}}`, which inserts unescaped markup; bind the value normally or build a nested `html` template.",
      call: "Unexpected `{{name}}(…)` call, which inserts unescaped markup; bind the value normally or build a nested `html` template.",
    },
  },
  create(context) {
    /** Local binding name to the directive it was imported as. */
    const locals = new Map<string, string>();
    return {
      ImportDeclaration(node: TSESTree.ImportDeclaration): void {
        if (!UNSAFE_SOURCES.has(node.source.value)) {
          return;
        }
        for (const specifier of node.specifiers) {
          if (specifier.type !== "ImportSpecifier") {
            continue;
          }
          const name = keyName(specifier.imported);
          if (name === null || !BANNED.has(name)) {
            continue;
          }
          locals.set(specifier.local.name, name);
          context.report({ node: specifier, messageId: "imported", data: { name } });
        }
      },
      CallExpression(node: TSESTree.CallExpression): void {
        if (node.callee.type !== "Identifier") {
          return;
        }
        const name = locals.get(node.callee.name);
        if (name !== undefined) {
          context.report({ node, messageId: "call", data: { name } });
        }
      },
    };
  },
};
