import type { TSESTree } from "@typescript-eslint/types";

import {
  docsUrl,
  enclosingClass,
  isInsideMethod,
  isLitComponent,
  type LitRule,
  memberPath,
} from "#helpers";

/** Whether a callee refers to `dispatchEvent`, at any depth. */
function isDispatchCallee(callee: TSESTree.Expression): boolean {
  if (callee.type === "Identifier") {
    return callee.name === "dispatchEvent";
  }
  return (
    callee.type === "MemberExpression" &&
    !callee.computed &&
    callee.property.type === "Identifier" &&
    callee.property.name === "dispatchEvent"
  );
}

/**
 * `no-dispatch-in-render` - rejects calling `dispatchEvent(...)` from
 * `render()`.
 *
 * `render()` must be free of side effects. Dispatching an event from it fires
 * once per render pass, at a moment the component does not control.
 */
export const noDispatchInRenderRule: LitRule = {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow dispatching events from `render()`",
      url: docsUrl("no-dispatch-in-render"),
    },
    schema: [],
    messages: {
      dispatch:
        "Unexpected `{{path}}()` inside `render()`; dispatch from an event handler or from `updated()` instead.",
    },
  },
  create(context) {
    return {
      CallExpression(node: TSESTree.CallExpression): void {
        if (!isDispatchCallee(node.callee) || !isInsideMethod(node, "render")) {
          return;
        }
        const classNode = enclosingClass(node);
        if (classNode === null || !isLitComponent(classNode, context)) {
          return;
        }
        const path = memberPath(node.callee) ?? "dispatchEvent";
        context.report({ node, messageId: "dispatch", data: { path } });
      },
    };
  },
};
