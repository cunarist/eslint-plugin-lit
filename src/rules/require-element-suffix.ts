import type { TSESTree } from "@typescript-eslint/types";

import {
  type ClassNode,
  customElementTag,
  docsUrl,
  isLitComponent,
  type LitRule,
  type LitRuleContext,
} from "#helpers";

/** Reports a registered component whose name lacks the suffix. */
function check(context: LitRuleContext, node: ClassNode): void {
  // Only registered elements: a base class is not an element yet.
  if (!isLitComponent(node, context) || customElementTag(node) === null) {
    return;
  }
  const id = node.id;
  if (id === null || id.name.endsWith("Element")) {
    return;
  }
  context.report({ node: id, messageId: "suffix", data: { name: id.name } });
}

/**
 * `require-element-suffix` — requires a registered component class name to
 * end in `Element`.
 *
 * A component class is named for what it is, the same way a controller is. The
 * suffix separates the element from the plain classes around it.
 */
export const requireElementSuffixRule: LitRule = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Require registered component class names to end in `Element`",
      url: docsUrl("require-element-suffix"),
    },
    schema: [],
    messages: {
      suffix: 'Component "{{name}}" is not named `…Element`.',
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
