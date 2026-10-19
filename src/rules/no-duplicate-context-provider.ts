import type { TSESTree } from "@typescript-eslint/types";

import {
  type ClassMember,
  classMembers,
  type ClassNode,
  docsUrl,
  keyName,
  type LitRule,
  memberPath,
} from "#helpers";

/** The `context:` expression of a `@provide({ context: x })` decorator. */
function providedContext(decorator: TSESTree.Decorator): string | null {
  const expression = decorator.expression;
  if (expression.type !== "CallExpression") {
    return null;
  }
  const callee = memberPath(expression.callee);
  if (callee === null || (callee !== "provide" && !callee.endsWith(".provide"))) {
    return null;
  }
  const options = expression.arguments[0];
  if (options?.type !== "ObjectExpression") {
    return null;
  }
  for (const property of options.properties) {
    if (property.type === "Property" && !property.computed && keyName(property.key) === "context") {
      return memberPath(property.value);
    }
  }
  return null;
}

/** Decorators on a class member, or an empty list for members without any. */
function memberDecorators(member: ClassMember): TSESTree.Decorator[] {
  switch (member.type) {
    case "PropertyDefinition":
    case "AccessorProperty":
    case "MethodDefinition":
      return member.decorators;
    default:
      return [];
  }
}

/**
 * `no-duplicate-context-provider` - rejects two `@provide` declarations for the
 * same context object on one class.
 *
 * Both register a provider for the same context on the same element. Only one
 * can answer a consumer's request, and which one wins is an implementation
 * detail. The second field looks live but is never read.
 */
export const noDuplicateContextProviderRule: LitRule = {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow providing the same context twice from one class",
      url: docsUrl("no-duplicate-context-provider"),
    },
    schema: [],
    messages: {
      duplicate:
        "Unexpected second `@provide` for `{{context}}`, which this class already provides.",
    },
  },
  create(context) {
    function check(node: ClassNode): void {
      const seen = new Set<string>();
      for (const member of classMembers(node)) {
        for (const decorator of memberDecorators(member)) {
          const provided = providedContext(decorator);
          if (provided === null) {
            continue;
          }
          if (seen.has(provided)) {
            context.report({
              node: decorator,
              messageId: "duplicate",
              data: { context: provided },
            });
            continue;
          }
          seen.add(provided);
        }
      }
    }

    return {
      ClassDeclaration: check,
      ClassExpression: check,
    };
  },
};
