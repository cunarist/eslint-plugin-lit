import type { TSESTree } from "@typescript-eslint/types";

import { docsUrl, type LitRule } from "#helpers";

/**
 * `no-update-complete` - `updateComplete` is hidden scheduling: awaiting it
 * makes DOM state settle instead of deriving it. The access itself is banned,
 * not the `await` or `.then` around it, so no spelling slips through.
 */
export const noUpdateCompleteRule: LitRule = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Disallow accessing `updateComplete`",
      url: docsUrl("no-update-complete"),
    },
    schema: [],
    messages: {
      updateComplete: "Unexpected access to `updateComplete`.",
    },
  },
  create(context) {
    return {
      MemberExpression(node: TSESTree.MemberExpression): void {
        if (
          node.computed ||
          node.property.type !== "Identifier" ||
          node.property.name !== "updateComplete"
        ) {
          return;
        }
        context.report({ node, messageId: "updateComplete" });
      },
    };
  },
};
