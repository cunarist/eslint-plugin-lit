import type { TSESTree } from "@typescript-eslint/types";

import {
  type ClassNode,
  docsUrl,
  isLitComponent,
  isReactiveController,
  keyName,
  type LitRule,
} from "#helpers";

/**
 * Find an instance member by name, whether it is written as a method or as a
 * property holding an arrow function.
 */
function findMember(
  node: ClassNode,
  name: string,
): TSESTree.MethodDefinition | TSESTree.PropertyDefinition | null {
  for (const member of node.body.body) {
    if (
      (member.type === "MethodDefinition" || member.type === "PropertyDefinition") &&
      !member.static &&
      keyName(member.key) === name
    ) {
      return member;
    }
  }
  return null;
}

/**
 * `paired-lifecycle` - `hostConnected` and `hostDisconnected` come as a pair.
 *
 * Whatever the first one starts, listeners, subscriptions, timers, the second
 * one has to stop, or the controller leaks every time its host is detached.
 * Defining neither is fine; defining one is not.
 */
export const pairedLifecycleRule: LitRule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Require a reactive controller to define both `hostConnected` and `hostDisconnected`, or neither",
      url: docsUrl("paired-lifecycle"),
    },
    schema: [],
    messages: {
      unpaired: "Expected reactive controller with `{{present}}` to also define `{{missing}}`.",
    },
  },
  create(context) {
    /** Reports a controller that defines exactly one of the two host hooks. */
    function check(node: ClassNode): void {
      if (isLitComponent(node, context) || !isReactiveController(node)) {
        return;
      }
      const connected = findMember(node, "hostConnected");
      const disconnected = findMember(node, "hostDisconnected");
      if (connected !== null && disconnected === null) {
        context.report({
          node: connected.key,
          messageId: "unpaired",
          data: { present: "hostConnected", missing: "hostDisconnected" },
        });
      } else if (connected === null && disconnected !== null) {
        context.report({
          node: disconnected.key,
          messageId: "unpaired",
          data: { present: "hostDisconnected", missing: "hostConnected" },
        });
      }
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
