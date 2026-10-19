import type { TSESTree } from "@typescript-eslint/types";

import { docsUrl, enclosingClass, isInsideMethod, isLitComponent, type LitRule } from "#helpers";

/** Hooks that run after the update has been committed. */
const POST_UPDATE_HOOKS: readonly string[] = ["updated", "firstUpdated"];

/** Whether a callee is `this.requestUpdate` or a bare `requestUpdate`. */
function isRequestUpdateCallee(callee: TSESTree.Expression): boolean {
  if (callee.type === "Identifier") {
    return callee.name === "requestUpdate";
  }
  if (
    callee.type !== "MemberExpression" ||
    callee.computed ||
    callee.object.type !== "ThisExpression"
  ) {
    return false;
  }
  return callee.property.type === "Identifier" && callee.property.name === "requestUpdate";
}

/** The post-update hook enclosing `node`, or null. */
function enclosingPostUpdateHook(node: TSESTree.Node): string | null {
  return POST_UPDATE_HOOKS.find((hook) => isInsideMethod(node, hook)) ?? null;
}

/**
 * `no-request-update-in-updated` - rejects calling `this.requestUpdate()`
 * inside `updated()` or `firstUpdated()`.
 *
 * Those hooks run at the end of an update; the requested update runs the hook
 * again, which requests another one.
 */
export const noRequestUpdateInUpdatedRule: LitRule = {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow calling `requestUpdate()` in `updated()` or `firstUpdated()`",
      url: docsUrl("no-request-update-in-updated"),
    },
    schema: [],
    messages: {
      request: "Unexpected requestUpdate() call inside {{hook}}().",
    },
  },
  create(context) {
    return {
      CallExpression(node: TSESTree.CallExpression): void {
        if (!isRequestUpdateCallee(node.callee)) {
          return;
        }
        const hook = enclosingPostUpdateHook(node);
        if (hook === null) {
          return;
        }
        const classNode = enclosingClass(node);
        if (classNode === null || !isLitComponent(classNode, context)) {
          return;
        }
        context.report({ node, messageId: "request", data: { hook } });
      },
    };
  },
};
