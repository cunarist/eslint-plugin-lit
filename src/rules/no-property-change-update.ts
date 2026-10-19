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

/**
 * `no-property-change-update` - rejects assigning to a reactive property
 * inside `update()`.
 *
 * The assignment schedules another update, which assigns again: an infinite
 * update loop. `willUpdate()` is the place for derived state.
 */
export const noPropertyChangeUpdateRule: LitRule = {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow changing a reactive property in `update()`",
      url: docsUrl("no-property-change-update"),
    },
    schema: [],
    messages: {
      change: 'Unexpected change to reactive property "{{name}}" inside update().',
    },
  },
  create(context) {
    /** Report if `target` is `this.<reactiveProperty>` inside `update()`. */
    function check(node: TSESTree.Node, target: TSESTree.Node): void {
      if (!isInsideMethod(node, "update")) {
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
      context.report({ node, messageId: "change", data: { name } });
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
