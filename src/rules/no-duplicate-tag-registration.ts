import type { TSESTree } from "@typescript-eslint/types";

import type { ClassNode, LitRule } from "#helpers";
import { classDecorators, docsUrl, memberPath } from "#helpers";

/** A tag registration found in the file. */
interface Registration {
  tag: string;
  node: TSESTree.Literal;
}

/** The `"x-y"` literal passed to `@customElement`, if the class has one. */
function customElementTagNode(node: ClassNode): TSESTree.StringLiteral | null {
  for (const decorator of classDecorators(node)) {
    const expression = decorator.expression;
    if (expression.type !== "CallExpression" || memberPath(expression.callee) !== "customElement") {
      continue;
    }
    const first = expression.arguments[0];
    if (first?.type === "Literal" && typeof first.value === "string") {
      return first;
    }
  }
  return null;
}

/** Whether a call is `customElements.define(…)`, however it is qualified. */
function isDefineCall(node: TSESTree.CallExpression): boolean {
  const path = memberPath(node.callee);
  return (
    path !== null && (path === "customElements.define" || path.endsWith(".customElements.define"))
  );
}

/**
 * `no-duplicate-tag-registration` — rejects registering the same custom
 * element tag twice in one file.
 *
 * `customElements.define` throws `NotSupportedError` when a tag is already
 * registered, and `@customElement` is a wrapper around it. Two registrations of
 * the same tag in one file take the whole module down at import time.
 */
export const noDuplicateTagRegistrationRule: LitRule = {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow registering the same custom element tag twice in one file",
      url: docsUrl("no-duplicate-tag-registration"),
    },
    schema: [],
    messages: {
      duplicate:
        "Unexpected second registration of `{{tag}}` in this file; a custom element tag can only be defined once.",
    },
  },
  create(context) {
    const registrations: Registration[] = [];

    function collectClass(node: ClassNode): void {
      const tagNode = customElementTagNode(node);
      if (tagNode !== null) {
        registrations.push({ tag: tagNode.value, node: tagNode });
      }
    }

    return {
      ClassDeclaration: collectClass,
      ClassExpression: collectClass,
      CallExpression(node: TSESTree.CallExpression): void {
        if (!isDefineCall(node)) {
          return;
        }
        const first = node.arguments[0];
        if (first?.type === "Literal" && typeof first.value === "string") {
          registrations.push({ tag: first.value, node: first });
        }
      },
      "Program:exit"(): void {
        // Order of collection across visitor kinds is not guaranteed, so sort
        // by position to make "the first one wins" mean the first in the file.
        const ordered = registrations.toSorted((a, b) => a.node.range[0] - b.node.range[0]);
        const seen = new Set<string>();
        for (const registration of ordered) {
          if (seen.has(registration.tag)) {
            context.report({
              node: registration.node,
              messageId: "duplicate",
              data: { tag: registration.tag },
            });
            continue;
          }
          seen.add(registration.tag);
        }
      },
    };
  },
};
