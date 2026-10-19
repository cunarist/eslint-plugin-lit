import type { TSESTree } from "@typescript-eslint/types";

import {
  classMembers,
  type ClassNode,
  docsUrl,
  findDecorator,
  isLitComponent,
  keyName,
  type LitRule,
  type LitRuleContext,
  pascalToKebab,
} from "#helpers";

/** Name of an object-literal key, for options and `static properties`. */
function objectKeyName(key: TSESTree.Property["key"]): string | null {
  if (key.type === "Identifier") {
    return key.name;
  }
  if (key.type === "Literal" && typeof key.value === "string") {
    return key.value;
  }
  return null;
}

/** Whether an options object literal sets `attribute`. */
function declaresAttribute(node: TSESTree.Node | null): boolean {
  if (node?.type !== "ObjectExpression") {
    return false;
  }
  for (const entry of node.properties) {
    // A spread could carry `attribute`; assume it does rather than false-flag.
    if (entry.type === "SpreadElement") {
      return true;
    }
    if (objectKeyName(entry.key) === "attribute") {
      return true;
    }
  }
  return false;
}

/** The options object passed to `@property({...})`, if any. */
function decoratorOptions(decorator: TSESTree.Decorator): TSESTree.Node | null {
  const expression = decorator.expression;
  if (expression.type !== "CallExpression") {
    return null;
  }
  const first = expression.arguments[0];
  if (first === undefined || first.type === "SpreadElement") {
    return null;
  }
  return first;
}

/** Whether a property name maps cleanly to a lowercase attribute. */
function isLowercase(name: string): boolean {
  return name === name.toLowerCase();
}

/**
 * Where the suggestion writes `attribute: "<name>"`: into an options object,
 * or into an empty `@property()` call. Null when the shape is anything else.
 */
interface Insertion {
  at: number;
  text: string;
}

/** The insertion that names the attribute in an options object literal. */
function objectInsertion(node: TSESTree.ObjectExpression, attribute: string): Insertion {
  const option = `attribute: ${JSON.stringify(attribute)}`;
  const first = node.properties[0];
  if (first === undefined) {
    return { at: node.range[0] + 1, text: ` ${option} ` };
  }
  return { at: first.range[0], text: `${option}, ` };
}

/** The insertion for a `@property(...)` decorator, or null. */
function decoratorInsertion(decorator: TSESTree.Decorator, attribute: string): Insertion | null {
  const expression = decorator.expression;
  if (expression.type !== "CallExpression") {
    return null;
  }
  const first = expression.arguments[0];
  if (first === undefined) {
    return {
      at: expression.range[1] - 1,
      text: `{ attribute: ${JSON.stringify(attribute)} }`,
    };
  }
  return first.type === "ObjectExpression" ? objectInsertion(first, attribute) : null;
}

/** Reports a camelCase reactive property, with a suggestion when one fits. */
function report(
  context: LitRuleContext,
  node: TSESTree.Node,
  name: string,
  insertion: Insertion | null,
): void {
  const attribute = pascalToKebab(name);
  context.report({
    node,
    messageId: "implicit",
    data: { name, lowercase: name.toLowerCase() },
    suggest:
      insertion === null
        ? []
        : [
            {
              messageId: "nameAttribute",
              data: { attribute },
              fix: (fixer) =>
                fixer.insertTextBeforeRange([insertion.at, insertion.at], insertion.text),
            },
          ],
  });
}

/** Checks every reactive property a Lit component declares. */
function check(context: LitRuleContext, node: ClassNode): void {
  if (!isLitComponent(node, context)) {
    return;
  }
  for (const member of classMembers(node)) {
    if (member.type !== "PropertyDefinition" && member.type !== "AccessorProperty") {
      continue;
    }
    const decorator = findDecorator(member.decorators, "property");
    if (decorator !== null) {
      const name = keyName(member.key);
      if (name === null || isLowercase(name) || declaresAttribute(decoratorOptions(decorator))) {
        continue;
      }
      report(context, member.key, name, decoratorInsertion(decorator, pascalToKebab(name)));
      continue;
    }
    if (!member.static || keyName(member.key) !== "properties") {
      continue;
    }
    const value = member.value;
    if (value?.type !== "ObjectExpression") {
      continue;
    }
    for (const entry of value.properties) {
      if (entry.type !== "Property") {
        continue;
      }
      const name = objectKeyName(entry.key);
      if (name === null || isLowercase(name) || declaresAttribute(entry.value)) {
        continue;
      }
      const insertion =
        entry.value.type === "ObjectExpression"
          ? objectInsertion(entry.value, pascalToKebab(name))
          : null;
      report(context, entry.key, name, insertion);
    }
  }
}

/**
 * `attribute-names` - rejects a camelCase reactive property that does not
 * declare an explicit `attribute` option.
 *
 * HTML attribute names are ASCII case-insensitive, so Lit lowercases them. A
 * property named `myProp` is observed as the attribute `myprop`, not `my-prop`,
 * a mismatch that silently does nothing when someone writes
 * `<my-el my-prop="...">`.
 */
export const attributeNamesRule: LitRule = {
  meta: {
    type: "problem",
    docs: {
      description: "Require an explicit `attribute` option on camelCase reactive properties",
      url: docsUrl("attribute-names"),
    },
    hasSuggestions: true,
    schema: [],
    messages: {
      implicit:
        'Reactive property "{{name}}" has no explicit attribute name, so its attribute is "{{lowercase}}".',
      nameAttribute: 'Name the attribute explicitly: `attribute: "{{attribute}}"`.',
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
