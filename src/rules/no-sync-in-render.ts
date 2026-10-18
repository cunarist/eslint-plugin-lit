import type { TSESTree } from "@typescript-eslint/types";

import {
  classStackVisitors,
  controllerSyncCall,
  docsUrl,
  hostControllerFields,
  isLocalLitComponent,
  isStackInMethod,
  type LitRule,
  litComponentBaseNames,
  stackClass,
  type SyncScopeNode,
} from "#helpers";

/**
 * `no-sync-in-render` — rejects `render()` calling `sync*()` on one of the
 * component's reactive controllers.
 *
 * Syncing changes controller state, and `render()` must not change state; a
 * property setter is where the host syncs a controller.
 */
export const noSyncInRenderRule: LitRule = {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow calling a reactive controller's `sync*()` methods from `render()`",
      url: docsUrl("no-sync-in-render"),
    },
    schema: [],
    messages: {
      syncInRender:
        "Unexpected call to `{{method}}()` on a reactive controller inside `render()`; sync from a property setter instead.",
    },
  },
  create(context) {
    const bases = litComponentBaseNames();
    const stack: SyncScopeNode[] = [];
    return {
      ...classStackVisitors(stack, bases),
      MethodDefinition(node: TSESTree.MethodDefinition): void {
        stack.push(node);
      },
      "MethodDefinition:exit"(): void {
        stack.pop();
      },
      CallExpression(node: TSESTree.CallExpression): void {
        const call = controllerSyncCall(node);
        if (call === null || !isStackInMethod(stack, "render")) {
          return;
        }
        const owner = stackClass(stack);
        if (
          owner === null ||
          !isLocalLitComponent(owner, bases) ||
          !hostControllerFields(owner).has(call.field)
        ) {
          return;
        }
        context.report({ node, messageId: "syncInRender", data: { method: call.method } });
      },
    };
  },
};
