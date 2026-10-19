import type { TSESTree } from "@typescript-eslint/types";

import { docsUrl, importedLocalName, isRepeatModule, type LitRule, memberPath } from "#helpers";

/**
 * `require-repeat-key` - rejects `repeat(items, template)`, the two-argument
 * form with no key function.
 *
 * Without a key `repeat` reconciles by index, exactly what a plain array
 * binding already does, so the directive buys nothing. Calls are matched
 * wherever they are written, not only inside a template.
 */
export const requireRepeatKeyRule: LitRule = {
  meta: {
    type: "problem",
    docs: {
      description: "Require a key function in `repeat()`",
      url: docsUrl("require-repeat-key"),
    },
    schema: [],
    messages: {
      noKey:
        "`repeat(...)` called without a key function reconciles by index; pass `(item) => item.id` as the second argument.",
    },
  },
  create(context) {
    /** Local names bound to `repeat` from Lit's directive module. */
    const locals = new Set<string>();
    return {
      ImportDeclaration(node: TSESTree.ImportDeclaration): void {
        const local = importedLocalName(node, isRepeatModule, "repeat");
        if (local !== null) {
          locals.add(local);
        }
      },
      CallExpression(node: TSESTree.CallExpression): void {
        const callee = memberPath(node.callee);
        if (callee === null || !locals.has(callee) || node.arguments.length !== 2) {
          return;
        }
        // A spread could supply the key at runtime; the arity is unknowable.
        if (node.arguments.some((argument) => argument.type === "SpreadElement")) {
          return;
        }
        context.report({ node, messageId: "noKey" });
      },
    };
  },
};
