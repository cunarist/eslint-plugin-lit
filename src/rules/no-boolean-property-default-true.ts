import type { RuleTextEdit, RuleTextEditor } from "@eslint/core";
import type { TSESTree } from "@typescript-eslint/types";

import {
  type ClassNode,
  classMembers,
  docsUrl,
  findDecorator,
  isLitComponent,
  keyName,
  type LitRule,
  type LitRuleContext,
} from "#helpers";

/** A class field, plain or `accessor`. */
type FieldNode = TSESTree.PropertyDefinition | TSESTree.AccessorProperty;

/** The value of one entry of an options object literal. */
function optionValue(options: TSESTree.Node | null, name: string): TSESTree.Node | null {
  if (options?.type !== "ObjectExpression") {
    return null;
  }
  for (const entry of options.properties) {
    if (entry.type === "Property" && keyName(entry.key) === name) {
      return entry.value;
    }
  }
  return null;
}

/** The options object passed to `@property({...})`, if it is a literal. */
function decoratorOptions(decorator: TSESTree.Decorator): TSESTree.ObjectExpression | null {
  const expression = decorator.expression;
  if (expression.type !== "CallExpression") {
    return null;
  }
  const first = expression.arguments[0];
  return first?.type === "ObjectExpression" ? first : null;
}

/** Whether an options object says `attribute: false`. */
function attributeDisabled(options: TSESTree.Node | null): boolean {
  const value = optionValue(options, "attribute");
  return value?.type === "Literal" && value.value === false;
}

/** Whether an options object says `type: Boolean`. */
function declaresBoolean(options: TSESTree.Node | null): boolean {
  const value = optionValue(options, "type");
  return value?.type === "Identifier" && value.name === "Boolean";
}

/**
 * The initializer to report, when it is not provably absent or false.
 *
 * Only two shapes are provably safe: no initializer at all, and literal
 * `false`. A computed default such as `DEFAULTS.open` may be `true`, and
 * nothing in the file settles it.
 */
function unsafeInitializer(member: FieldNode): TSESTree.Expression | null {
  const value = member.value;
  if (value === null || (value.type === "Literal" && value.value === false)) {
    return null;
  }
  return value;
}

/** Whether a class member is a field, plain or `accessor`. */
function isField(member: TSESTree.ClassElement): member is FieldNode {
  return member.type === "PropertyDefinition" || member.type === "AccessorProperty";
}

/** Instance fields of a class, keyed by name. */
function fieldsByName(node: ClassNode): Map<string, FieldNode> {
  const fields = new Map<string, FieldNode>();
  for (const member of classMembers(node)) {
    if (!isField(member) || member.static) {
      continue;
    }
    const name = keyName(member.key);
    if (name !== null) {
      fields.set(name, member);
    }
  }
  return fields;
}

/** Reports a boolean property's default, suggesting literal `false`. */
function report(context: LitRuleContext, node: TSESTree.Expression, name: string): void {
  context.report({
    node,
    messageId: "truthyDefault",
    data: { name },
    suggest: [
      {
        messageId: "defaultFalse",
        fix: (fixer: RuleTextEditor): RuleTextEdit => fixer.replaceText(node, "false"),
      },
    ],
  });
}

/** Checks a `static properties = { ... }` declaration against the fields. */
function checkStaticProperties(
  context: LitRuleContext,
  value: TSESTree.Expression | null,
  fields: Map<string, FieldNode>,
): void {
  if (value?.type !== "ObjectExpression") {
    return;
  }
  for (const entry of value.properties) {
    if (entry.type !== "Property") {
      continue;
    }
    const name = keyName(entry.key);
    if (name === null || attributeDisabled(entry.value) || !declaresBoolean(entry.value)) {
      continue;
    }
    const field = fields.get(name);
    const initializer = field === undefined ? null : unsafeInitializer(field);
    if (initializer !== null) {
      report(context, initializer, name);
    }
  }
}

/** Checks a field decorated with `@property(...)`. */
function checkDecorated(
  context: LitRuleContext,
  member: FieldNode,
  decorator: TSESTree.Decorator,
): void {
  const options = decoratorOptions(decorator);
  const initializer = unsafeInitializer(member);
  const name = keyName(member.key);
  if (
    !attributeDisabled(options) &&
    declaresBoolean(options) &&
    initializer !== null &&
    name !== null
  ) {
    report(context, initializer, name);
  }
}

/** Checks every boolean reactive property of a Lit component. */
function check(context: LitRuleContext, node: ClassNode): void {
  if (!isLitComponent(node, context)) {
    return;
  }
  const fields = fieldsByName(node);
  for (const member of classMembers(node)) {
    if (!isField(member)) {
      continue;
    }
    const decorator = findDecorator(member.decorators, "property");
    if (decorator !== null) {
      checkDecorated(context, member, decorator);
      continue;
    }
    if (member.static && keyName(member.key) === "properties") {
      checkStaticProperties(context, member.value, fields);
    }
  }
}

/**
 * `no-boolean-property-default-true` — Lit's `Boolean` converter follows the
 * HTML rule: the attribute's presence is `true` and its absence is `false`.
 * No markup says "false", so a boolean reactive property that defaults to
 * `true` can never be turned off from a template. Name the property for the
 * non-default state and default it to `false` instead.
 */
export const noBooleanPropertyDefaultTrueRule: LitRule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow a `type: Boolean` reactive property whose default is not literal `false`",
      url: docsUrl("no-boolean-property-default-true"),
    },
    hasSuggestions: true,
    schema: [],
    messages: {
      truthyDefault: "Boolean property '{{name}}' has a default that is not literal `false`.",
      defaultFalse: "Default the property to `false`.",
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
