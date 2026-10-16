import type { TSESTree } from "@typescript-eslint/types";

import type { LitRule } from "#helpers";
import { docsUrl, enclosingClass, isLitComponent, memberPath } from "#helpers";

/** Receivers that are the component itself. */
const SELF_RECEIVERS: ReadonlySet<string> = new Set(["this", "this.renderRoot"]);

/**
 * `require-dispatch-on-this` — requires a component's events to be dispatched
 * on the component itself.
 *
 * A listener bound with `@event=` sits on the element, so an event sent
 * anywhere else never reaches it. A receiver that is not a plain name or
 * member chain, such as a call result or an index, is not judged.
 */
export const requireDispatchOnThisRule: LitRule = {
  meta: {
    type: "problem",
    docs: {
      description: "Require a component's events to be dispatched on the component itself",
      url: docsUrl("require-dispatch-on-this"),
    },
    hasSuggestions: true,
    schema: [],
    messages: {
      elsewhere:
        "Event dispatched on `{{receiver}}` instead of the component never reaches a parent's `@event=` listener.",
      onThis: "Dispatch the event on `this`.",
    },
  },
  create(context) {
    return {
      CallExpression(node: TSESTree.CallExpression): void {
        const callee = node.callee;
        if (callee.type !== "MemberExpression" || callee.computed) {
          return;
        }
        if (memberPath(callee.property) !== "dispatchEvent") {
          return;
        }
        const receiver = memberPath(callee.object);
        if (receiver === null || SELF_RECEIVERS.has(receiver)) {
          return;
        }
        const owner = enclosingClass(node);
        if (owner === null || !isLitComponent(owner, context)) {
          return;
        }
        context.report({
          node,
          messageId: "elsewhere",
          data: { receiver },
          suggest: [
            {
              messageId: "onThis",
              fix: (fixer) => fixer.replaceText(callee.object, "this"),
            },
          ],
        });
      },
    };
  },
};
