import type { TSESTree } from "@typescript-eslint/types";

import { docsUrl, enclosingClass, isLitComponent, type LitRule } from "#helpers";

/** DOM lookup methods banned inside a component. */
const QUERY_METHODS: ReadonlySet<string> = new Set(["querySelector", "querySelectorAll"]);

/**
 * `no-dom-query` — rejects `querySelector` and `querySelectorAll` inside a Lit
 * component.
 *
 * A component must not reach into its own rendered DOM by selector. Selectors
 * silently break when the template changes; a `ref` does not.
 */
export const noDomQueryRule: LitRule = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Disallow `querySelector` and `querySelectorAll` inside a Lit component",
      url: docsUrl("no-dom-query"),
    },
    schema: [],
    messages: {
      domQuery: "Unexpected DOM lookup via `{{name}}` in a Lit component.",
    },
  },
  create(context) {
    return {
      CallExpression(node: TSESTree.CallExpression): void {
        const callee = node.callee;
        if (callee.type !== "MemberExpression" || callee.computed) {
          return;
        }
        const property = callee.property;
        if (property.type !== "Identifier" || !QUERY_METHODS.has(property.name)) {
          return;
        }
        const owner = enclosingClass(node);
        if (owner === null || !isLitComponent(owner, context)) {
          return;
        }
        context.report({ node: callee, messageId: "domQuery", data: { name: property.name } });
      },
    };
  },
};
