import type { TSESTree } from "@typescript-eslint/types";

import { docsUrl, enclosingClass, isLitComponent, type LitRule } from "#helpers";

/** Scheduling primitives banned inside a component. */
const TIMER_NAMES: ReadonlySet<string> = new Set([
  "setTimeout",
  "setInterval",
  "requestAnimationFrame",
  "queueMicrotask",
]);

/** The bare name a callee resolves to, e.g. `globalThis.setTimeout` -> `setTimeout`. */
function calleeBareName(callee: TSESTree.Expression): string | null {
  if (callee.type === "Identifier") {
    return callee.name;
  }
  if (
    callee.type === "MemberExpression" &&
    !callee.computed &&
    callee.property.type === "Identifier"
  ) {
    return callee.property.name;
  }
  return null;
}

/**
 * `no-timers` - timers inside a component are hidden scheduling.
 *
 * They make DOM or editor state "settle" instead of deriving it, and they
 * create a handle nobody releases on disconnect.
 */
export const noTimersRule: LitRule = {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Disallow `setTimeout`, `setInterval`, `requestAnimationFrame`, and `queueMicrotask` inside a Lit component",
      url: docsUrl("no-timers"),
    },
    schema: [],
    messages: {
      timer:
        "Unexpected `{{name}}` call in a Lit component; move the timer into a reactive controller that clears it in `hostDisconnected`.",
    },
  },
  create(context) {
    return {
      CallExpression(node: TSESTree.CallExpression): void {
        const name = calleeBareName(node.callee);
        if (name === null || !TIMER_NAMES.has(name)) {
          return;
        }
        const owner = enclosingClass(node);
        if (owner === null || !isLitComponent(owner, context)) {
          return;
        }
        context.report({ node: node.callee, messageId: "timer", data: { name } });
      },
    };
  },
};
