import type { TSESTree } from "@typescript-eslint/types";

import { docsUrl, type LitRule } from "#helpers";

/** Directive modules a component may import. */
const ALLOWED_DIRECTIVES: ReadonlySet<string> = new Set([
  "lit/directives/ref.js",
  "lit/directives/repeat.js",
]);

/** Matches any Lit directive module specifier. */
const DIRECTIVE_SOURCE = /^(?:lit|lit-html|lit-element)\/directives\//u;

/**
 * `directive-allowlist` — only `ref` and `repeat` may be imported from
 * `lit/directives/*`. Every other directive hides control flow or state inside
 * the template.
 *
 * This governs which directives may be imported. It does not grant an imported
 * directive a place inside a template: `simple-template-expressions` still
 * requires `repeat(...)` to be hoisted out of the `html` template.
 */
export const directiveAllowlistRule: LitRule = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Disallow Lit directive imports other than `ref` and `repeat`",
      url: docsUrl("directive-allowlist"),
    },
    schema: [],
    messages: {
      disallowed: 'Unexpected import of the directive module "{{source}}".',
    },
  },
  create(context) {
    return {
      ImportDeclaration(node: TSESTree.ImportDeclaration): void {
        const source = node.source.value;
        if (!DIRECTIVE_SOURCE.test(source) || ALLOWED_DIRECTIVES.has(source)) {
          return;
        }
        context.report({ node: node.source, messageId: "disallowed", data: { source } });
      },
    };
  },
};
