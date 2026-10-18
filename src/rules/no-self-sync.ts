import type { TSESTree } from "@typescript-eslint/types";

import {
  classStackVisitors,
  docsUrl,
  isSyncingController,
  type LitRule,
  litComponentBaseNames,
  stackClass,
  type SyncScopeNode,
} from "#helpers";

/**
 * `no-self-sync` — rejects a reactive controller calling its own `sync*()`
 * method.
 *
 * Only the host drives sync. A controller that calls its own sync method from
 * another one hides a second entry point; shared work belongs in a private
 * method both call.
 */
export const noSelfSyncRule: LitRule = {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow a reactive controller calling its own `sync*()` methods",
      url: docsUrl("no-self-sync"),
    },
    schema: [],
    messages: {
      selfSync:
        "Unexpected call to `this.{{method}}()` inside a reactive controller; only the host drives sync, so move the shared work into a private method.",
    },
  },
  create(context) {
    const bases = litComponentBaseNames();
    const stack: SyncScopeNode[] = [];
    return {
      ...classStackVisitors(stack, bases),
      CallExpression(node: TSESTree.CallExpression): void {
        // A private `#sync` prefixed helper is the sanctioned escape hatch, so
        // only an identifier-named public member counts.
        const { callee } = node;
        if (
          callee.type !== "MemberExpression" ||
          callee.computed ||
          callee.object.type !== "ThisExpression" ||
          callee.property.type !== "Identifier" ||
          !callee.property.name.startsWith("sync")
        ) {
          return;
        }
        const owner = stackClass(stack);
        if (owner === null || !isSyncingController(owner, bases)) {
          return;
        }
        context.report({ node, messageId: "selfSync", data: { method: callee.property.name } });
      },
    };
  },
};
