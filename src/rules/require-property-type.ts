import type { TSESTree } from "@typescript-eslint/types";

import {
  classMembers,
  type ClassNode,
  docsUrl,
  findDecorator,
  isLitComponent,
  keyName,
  type LitRule,
} from "#helpers";

/** The options object passed to `@property({...})`, if it is a literal. */
function decoratorOptions(decorator: TSESTree.Decorator): TSESTree.ObjectExpression | null {
  const expression = decorator.expression;
  if (expression.type !== "CallExpression") {
    return null;
  }
  const first = expression.arguments[0];
  return first?.type === "ObjectExpression" ? first : null;
}

/**
 * Whether the options settle how the attribute is read.
 *
 * `type` names a converter. `converter` supplies one directly, overriding
 * whatever `type` would have selected. `attribute: false` removes the
 * attribute, so no conversion ever runs. A spread could carry any of these,
 * so it is taken as settling the question rather than guessed at.
 */
function settlesConversion(options: TSESTree.ObjectExpression): boolean {
  for (const entry of options.properties) {
    if (entry.type === "SpreadElement") {
      return true;
    }
    const name = keyName(entry.key);
    if (name === "type" || name === "converter") {
      return true;
    }
    if (name === "attribute" && entry.value.type === "Literal" && entry.value.value === false) {
      return true;
    }
  }
  return false;
}

/**
 * `require-property-type` - requires `{type: ...}` on every `@property` that has
 * an attribute.
 *
 * An attribute is always a string; `type` tells Lit how to convert it. The
 * check is syntactic on purpose: it asks whether `type` is written, never what
 * the property's declared type is, so aliases, named types, and generics are
 * reported too.
 */
export const requirePropertyTypeRule: LitRule = {
  meta: {
    type: "problem",
    docs: {
      description: "Require a `type` on every `@property` that has an attribute",
      url: docsUrl("require-property-type"),
    },
    schema: [],
    messages: {
      missingType:
        'Reactive property "{{name}}" declares no attribute type, so its attribute arrives as a string; add `type`, or `attribute: false` if it is never set from markup.',
    },
  },
  create(context) {
    function check(node: ClassNode): void {
      if (!isLitComponent(node, context)) {
        return;
      }
      for (const member of classMembers(node)) {
        if (member.type !== "PropertyDefinition" && member.type !== "AccessorProperty") {
          continue;
        }
        const decorator = findDecorator(member.decorators, "property");
        if (decorator === null) {
          continue;
        }
        const options = decoratorOptions(decorator);
        if (options !== null && settlesConversion(options)) {
          continue;
        }
        const name = keyName(member.key);
        if (name !== null) {
          context.report({ node: member.key, messageId: "missingType", data: { name } });
        }
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
