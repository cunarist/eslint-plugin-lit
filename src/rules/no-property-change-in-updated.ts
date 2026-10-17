import type { TSESTree } from "@typescript-eslint/types";

import {
  docsUrl,
  enclosingClass,
  isInsideMethod,
  isLitComponent,
  type LitRule,
  reactivePropertyNames,
  thisPropertyName,
} from "#helpers";

/** Hooks that run after the update has been committed. */
const POST_UPDATE_HOOKS: readonly string[] = ["updated", "firstUpdated"];

/** The post-update hook enclosing `node`, or null. */
function enclosingPostUpdateHook(node: TSESTree.Node): string | null {
  return POST_UPDATE_HOOKS.find((hook) => isInsideMethod(node, hook)) ?? null;
}

/**
 * `no-property-change-in-updated` — rejects assigning to a reactive property
 * inside `updated()` or `firstUpdated()`.
 *
 * The assignment marks the component dirty again, so Lit schedules another
 * update, which calls the hook again.
 */
export const noPropertyChangeInUpdatedRule: LitRule = {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow changing a reactive property in `updated()` or `firstUpdated()`",
      url: docsUrl("no-property-change-in-updated"),
    },
    schema: [],
    messages: {
      change: 'Unexpected change to reactive property "{{name}}" inside {{hook}}().',
    },
  },
  create(context) {
    /** Report if `target` is `this.<reactiveProperty>` in a post-update hook. */
    function check(node: TSESTree.Node, target: TSESTree.Node): void {
      const hook = enclosingPostUpdateHook(node);
      if (hook === null) {
        return;
      }
      const classNode = enclosingClass(node);
      if (classNode === null || !isLitComponent(classNode, context)) {
        return;
      }
      const name = thisPropertyName(target);
      if (name === null || !reactivePropertyNames(classNode).has(name)) {
        return;
      }
      context.report({ node, messageId: "change", data: { name, hook } });
    }

    return {
      AssignmentExpression(node: TSESTree.AssignmentExpression): void {
        check(node, node.left);
      },
      UpdateExpression(node: TSESTree.UpdateExpression): void {
        check(node, node.argument);
      },
    };
  },
};
