import type { TSESTree } from "@typescript-eslint/types";

import {
  docsUrl,
  enclosingClass,
  isInsideMethod,
  isLitComponent,
  type LitRule,
  memberPath,
} from "#helpers";

/** Whether an assignment target bottoms out at `this`. */
function targetsThis(node: TSESTree.Node): boolean {
  let current = node;
  while (current.type === "MemberExpression") {
    current = current.object;
  }
  return current.type === "ThisExpression";
}

/**
 * `no-this-assign-in-render` — rejects assigning to anything reached through
 * `this` inside `render()`.
 *
 * `render()` must be a pure function of the component's state. The check is
 * lexical: anything inside `render()`, at any depth, counts. That is exact
 * because `simple-template-expressions` forbids inline functions in bindings,
 * so a deferred callback cannot be written inside `render()`.
 */
export const noThisAssignInRenderRule: LitRule = {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow assigning to `this` or its members inside `render()`",
      url: docsUrl("no-this-assign-in-render"),
    },
    schema: [],
    messages: {
      assign: "Unexpected assignment to {{target}} inside render().",
    },
  },
  create(context) {
    /** Report if `target` mutates `this` inside `render()`. */
    function check(node: TSESTree.Node, target: TSESTree.Node): void {
      if (!isInsideMethod(node, "render")) {
        return;
      }
      const classNode = enclosingClass(node);
      if (classNode === null || !isLitComponent(classNode, context) || !targetsThis(target)) {
        return;
      }
      context.report({
        node,
        messageId: "assign",
        data: { target: memberPath(target) ?? "this" },
      });
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
