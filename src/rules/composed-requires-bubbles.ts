import type { TSESTree } from "@typescript-eslint/types";

import type { LitRule } from "#helpers";
import { docsUrl, keyName } from "#helpers";

/** Constructors that take an event-init object as their second argument. */
const EVENT_CONSTRUCTORS: ReadonlySet<string> = new Set(["Event", "CustomEvent"]);

/** A plain `name: value` member of an object literal. */
function namedProperty(
  member: TSESTree.ObjectLiteralElement,
  name: string,
): TSESTree.Property | null {
  return member.type === "Property" && !member.computed && keyName(member.key) === name
    ? member
    : null;
}

/** The `name: value` member of an object literal, if written literally. */
function option(options: TSESTree.ObjectExpression, name: string): TSESTree.Property | null {
  for (const member of options.properties) {
    const property = namedProperty(member, name);
    if (property !== null) {
      return property;
    }
  }
  return null;
}

/** Whether a node is the literal `value`. */
function isLiteral(node: TSESTree.Node, value: boolean): boolean {
  return node.type === "Literal" && node.value === value;
}

/**
 * `composed-requires-bubbles` — requires `bubbles: true` whenever an event is
 * constructed with `composed: true`.
 *
 * `composed: true` means "keep propagating once you reach a shadow boundary".
 * Propagation upward is what `bubbles: true` turns on in the first place, so a
 * composed event that does not bubble stops at the element that dispatched it
 * and never crosses out of the shadow root.
 */
export const composedRequiresBubblesRule: LitRule = {
  meta: {
    type: "problem",
    docs: {
      description: "Require `bubbles: true` on events constructed with `composed: true`",
      url: docsUrl("composed-requires-bubbles"),
    },
    hasSuggestions: true,
    schema: [],
    messages: {
      composed:
        "Unexpected `composed: true` without `bubbles: true`; a non-bubbling event never crosses the shadow boundary.",
      addBubbles: "Set `bubbles: true`.",
    },
  },
  create(context) {
    return {
      NewExpression(node: TSESTree.NewExpression): void {
        const callee = node.callee;
        if (callee.type !== "Identifier" || !EVENT_CONSTRUCTORS.has(callee.name)) {
          return;
        }
        const options = node.arguments[1];
        if (options?.type !== "ObjectExpression") {
          return;
        }
        // A spread or computed key could carry `bubbles` in from elsewhere; do
        // not guess.
        if (options.properties.some((member) => member.type !== "Property" || member.computed)) {
          return;
        }
        const composed = option(options, "composed");
        if (composed === null || !isLiteral(composed.value, true)) {
          return;
        }
        // Only a literal `false` or an absent key is a definite mistake; an
        // expression could be `true` at runtime.
        const bubbles = option(options, "bubbles");
        if (bubbles !== null && !isLiteral(bubbles.value, false)) {
          return;
        }
        context.report({
          node: composed,
          messageId: "composed",
          suggest: [
            {
              messageId: "addBubbles",
              fix: (fixer) =>
                bubbles === null
                  ? fixer.insertTextBeforeRange(composed.range, "bubbles: true, ")
                  : fixer.replaceTextRange(bubbles.value.range, "true"),
            },
          ],
        });
      },
    };
  },
};
