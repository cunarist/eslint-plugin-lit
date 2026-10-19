import type { TSESTree } from "@typescript-eslint/types";

import {
  classMembers,
  type ClassNode,
  docsUrl,
  enclosingClass,
  isLitComponent,
  isReactiveProperty,
  keyName,
  type LitRule,
  parentOf,
} from "#helpers";

/** Names declared by a `static properties = { ... }` object literal. */
function staticPropertyNames(value: TSESTree.Expression | null, names: Set<string>): void {
  if (value?.type !== "ObjectExpression") {
    return;
  }
  for (const entry of value.properties) {
    const name = entry.type === "Property" ? keyName(entry.key) : null;
    if (name !== null) {
      names.add(name);
    }
  }
}

/** Every reactive property a class declares, decorated or static. */
function reactivePropertyNames(node: ClassNode): Set<string> {
  const names = new Set<string>();
  for (const member of classMembers(node)) {
    if (member.type !== "PropertyDefinition" && member.type !== "AccessorProperty") {
      continue;
    }
    if (isReactiveProperty(member)) {
      const name = keyName(member.key);
      if (name !== null) {
        names.add(name);
      }
      continue;
    }
    if (
      member.type === "PropertyDefinition" &&
      member.static &&
      keyName(member.key) === "properties"
    ) {
      staticPropertyNames(member.value, names);
    }
  }
  return names;
}

/**
 * Whether this node sits directly inside a constructor: reached through the
 * constructor's own function, with no arrow function, function declaration, or
 * class in between. An assignment inside a callback the constructor registers
 * runs later, and is not this rule's business.
 */
function directlyInConstructor(node: TSESTree.Node): boolean {
  let current: TSESTree.Node | null = node;
  let previous: TSESTree.Node | undefined = undefined;
  while (current !== null) {
    switch (current.type) {
      case "MethodDefinition":
        return current.kind === "constructor" && previous?.type === "FunctionExpression";
      case "ArrowFunctionExpression":
      case "FunctionDeclaration":
      case "ClassDeclaration":
      case "ClassExpression":
        return false;
      default:
        previous = current;
        current = parentOf(current);
    }
  }
  return false;
}

/** The property name of a `this.foo = ...` target, if that is the shape. */
function thisPropertyName(node: TSESTree.Node): string | null {
  if (node.type !== "MemberExpression" || node.computed || node.object.type !== "ThisExpression") {
    return null;
  }
  return keyName(node.property);
}

/**
 * `no-property-assignment-in-constructor` - writing a reactive property in the
 * constructor runs before the element is connected, so Lit records a change
 * from `undefined` and schedules an update with nothing to react to. It is
 * also the one write SSR hydration cannot see: the client constructor
 * overwrites the values the server rendered from, and hydration mismatches. A
 * field initializer runs at the same moment but counts as the default.
 */
export const noPropertyAssignmentInConstructorRule: LitRule = {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow assigning a reactive property in the constructor",
      url: docsUrl("no-property-assignment-in-constructor"),
    },
    schema: [],
    messages: {
      constructorAssignment:
        "Unexpected assignment to reactive property '{{name}}' in the constructor.",
    },
  },
  create(context) {
    return {
      AssignmentExpression(node: TSESTree.AssignmentExpression): void {
        const name = thisPropertyName(node.left);
        if (name === null || !directlyInConstructor(node)) {
          return;
        }
        const owner = enclosingClass(node);
        if (
          owner === null ||
          !isLitComponent(owner, context) ||
          !reactivePropertyNames(owner).has(name)
        ) {
          return;
        }
        context.report({ node: node.left, messageId: "constructorAssignment", data: { name } });
      },
    };
  },
};
