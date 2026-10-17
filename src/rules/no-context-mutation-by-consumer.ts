import type { TSESTree } from "@typescript-eslint/types";

import {
  classMembers,
  type ClassNode,
  decoratorNames,
  docsUrl,
  enclosingClass,
  keyName,
  type LitRule,
  memberPath,
} from "#helpers";

/** Whether a decorator name, bare or namespaced, is `consume`. */
function isConsume(name: string): boolean {
  return name === "consume" || name.endsWith(".consume");
}

/** `this.…` paths of every `@consume` field on a class. */
function consumedPaths(node: ClassNode): ReadonlySet<string> {
  const paths = new Set<string>();
  for (const member of classMembers(node)) {
    if (member.type !== "PropertyDefinition" && member.type !== "AccessorProperty") {
      continue;
    }
    if (!decoratorNames(member.decorators).some((name) => isConsume(name))) {
      continue;
    }
    const name = keyName(member.key);
    if (name !== null) {
      paths.add(`this.${name}`);
    }
  }
  return paths;
}

/**
 * `no-context-mutation-by-consumer` — rejects assignment to a field declared
 * with `@consume`.
 *
 * A consumed field is a view of a value the provider owns. Writing to it
 * replaces the local copy only: the provider never sees the change, no other
 * consumer sees it, and the next time the provider publishes the write is
 * overwritten without warning.
 */
export const noContextMutationByConsumerRule: LitRule = {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow assigning to fields declared with `@consume`",
      url: docsUrl("no-context-mutation-by-consumer"),
    },
    schema: [],
    messages: {
      mutation:
        "Unexpected assignment to `{{path}}`, which `@consume` provides; change the value through the provider instead.",
    },
  },
  create(context) {
    function check(target: TSESTree.Node, node: TSESTree.Node): void {
      if (target.type !== "MemberExpression") {
        return;
      }
      const path = memberPath(target);
      const owner = enclosingClass(node);
      if (path === null || owner === null || !consumedPaths(owner).has(path)) {
        return;
      }
      context.report({ node: target, messageId: "mutation", data: { path } });
    }

    return {
      AssignmentExpression(node: TSESTree.AssignmentExpression): void {
        check(node.left, node);
      },
      UpdateExpression(node: TSESTree.UpdateExpression): void {
        check(node.argument, node);
      },
    };
  },
};
