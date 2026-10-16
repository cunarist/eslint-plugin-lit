import type { TSESTree } from "@typescript-eslint/types";

import {
  type ClassNode,
  docsUrl,
  isLitComponent,
  isReactiveController,
  type LitRule,
  type LitRuleContext,
} from "#helpers";

/** Reports a reactive controller whose name lacks the suffix. */
function check(context: LitRuleContext, node: ClassNode): void {
  if (isLitComponent(node, context) || !isReactiveController(node)) {
    return;
  }
  const id = node.id;
  if (id === null || id.name.endsWith("Controller")) {
    return;
  }
  context.report({ node: id, messageId: "suffix", data: { name: id.name } });
}

/**
 * `require-controller-suffix` — requires a reactive controller class name to
 * end in `Controller`.
 *
 * At the call site `#items = new ItemsController(this)` says which of the
 * field's collaborators drives updates; `new Items(this)` does not.
 */
export const requireControllerSuffixRule: LitRule = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Require reactive controller class names to end in `Controller`",
      url: docsUrl("require-controller-suffix"),
    },
    schema: [],
    messages: {
      suffix: 'Reactive controller "{{name}}" is not named `…Controller`.',
    },
  },
  create(context) {
    return {
      ClassDeclaration(node: TSESTree.ClassDeclaration): void {
        check(context, node);
      },
      ClassExpression(node: TSESTree.ClassExpression): void {
        check(context, node);
      },
    };
  },
};
