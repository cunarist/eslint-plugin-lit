import type { TSESTree } from "@typescript-eslint/types";

import { docsUrl, enclosingClass, isLitComponent, keyName, type LitRule } from "#helpers";

/**
 * Lifecycle hooks Lit never awaits.
 *
 * `performUpdate` is deliberately absent: Lit explicitly supports an async
 * override there to defer the update, and awaits it.
 */
const SYNC_LIFECYCLE: ReadonlySet<string> = new Set([
  "willUpdate",
  "update",
  "shouldUpdate",
  "firstUpdated",
  "updated",
  "connectedCallback",
  "disconnectedCallback",
]);

/**
 * `no-async-lifecycle` - rejects `async` on a Lit lifecycle hook.
 *
 * Lit calls its lifecycle hooks synchronously and never awaits the returned
 * Promise. An `async` hook therefore resumes after the render it was meant to
 * affect has already been committed.
 */
export const noAsyncLifecycleRule: LitRule = {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow `async` Lit lifecycle hooks",
      url: docsUrl("no-async-lifecycle"),
    },
    schema: [],
    messages: {
      async:
        "Unexpected async `{{name}}()`; Lit does not await it, so the work lands after the update it was meant to affect.",
    },
  },
  create(context) {
    return {
      MethodDefinition(node: TSESTree.MethodDefinition): void {
        if (node.static || node.kind !== "method" || !node.value.async) {
          return;
        }
        const name = keyName(node.key);
        if (name === null || !SYNC_LIFECYCLE.has(name)) {
          return;
        }
        const classNode = enclosingClass(node);
        if (classNode === null || !isLitComponent(classNode, context)) {
          return;
        }
        context.report({ node: node.key, messageId: "async", data: { name } });
      },
    };
  },
};
