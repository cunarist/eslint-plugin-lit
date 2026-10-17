import type { TSESTree } from "@typescript-eslint/types";

import { docsUrl, type LitRule, memberPath } from "#helpers";

/** Properties that parse their assigned string as markup. */
const MARKUP_SINKS: ReadonlySet<string> = new Set(["innerHTML", "outerHTML"]);

/** The sink name a member expression writes to, if it writes to one. */
function sinkName(target: TSESTree.MemberExpression): string | null {
  const property = target.property;
  if (target.computed) {
    if (property.type !== "Literal" || typeof property.value !== "string") {
      return null;
    }
    return MARKUP_SINKS.has(property.value) ? property.value : null;
  }
  if (property.type !== "Identifier") {
    return null;
  }
  return MARKUP_SINKS.has(property.name) ? property.name : null;
}

/**
 * `no-inner-html-assignment` — rejects assignment to `innerHTML` or
 * `outerHTML` on any receiver.
 *
 * Both parse the assigned string as markup, the classic XSS sink. Inside a Lit
 * component it also replaces the subtree Lit tracks through marker nodes, so
 * the next render wipes the markup or throws.
 */
export const noInnerHtmlAssignmentRule: LitRule = {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow assigning to `innerHTML` or `outerHTML`",
      url: docsUrl("no-inner-html-assignment"),
    },
    schema: [],
    messages: {
      assignment: "Unexpected assignment to `{{sink}}` on `{{receiver}}`.",
    },
  },
  create(context) {
    return {
      AssignmentExpression(node: TSESTree.AssignmentExpression): void {
        const target = node.left;
        if (target.type !== "MemberExpression") {
          return;
        }
        const sink = sinkName(target);
        if (sink === null) {
          return;
        }
        const receiver = memberPath(target.object) ?? "the element";
        context.report({ node: target, messageId: "assignment", data: { sink, receiver } });
      },
    };
  },
};
