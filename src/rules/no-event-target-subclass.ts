import type { TSESTree } from "@typescript-eslint/types";

import { type ClassNode, docsUrl, type LitRule, memberPath } from "#helpers";

/**
 * `no-event-target-subclass` — extending `EventTarget` builds a state bus that
 * Lit knows nothing about. Shared state belongs in a context.
 */
export const noEventTargetSubclassRule: LitRule = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Disallow classes that extend `EventTarget`",
      url: docsUrl("no-event-target-subclass"),
    },
    schema: [],
    messages: {
      eventTarget: "Unexpected class extending `EventTarget`.",
    },
  },
  create(context) {
    function check(node: ClassNode): void {
      const superClass = node.superClass;
      if (superClass === null || memberPath(superClass) !== "EventTarget") {
        return;
      }
      context.report({ node: superClass, messageId: "eventTarget" });
    }

    return {
      ClassDeclaration(node: TSESTree.ClassDeclaration): void {
        check(node);
      },
      ClassExpression(node: TSESTree.ClassExpression): void {
        check(node);
      },
    };
  },
};
