import type { TSESTree } from "@typescript-eslint/types";

import type { ClassNode, LitRule } from "#helpers";
import {
  classMembers,
  docsUrl,
  enclosingClass,
  isLitComponent,
  isReactiveProperty,
  keyName,
} from "#helpers";

/** Array methods that mutate the receiver in place. */
const MUTATING_METHODS: ReadonlySet<string> = new Set([
  "push",
  "pop",
  "shift",
  "unshift",
  "splice",
  "sort",
  "reverse",
  "fill",
  "copyWithin",
]);

/** Name of an object-literal key, for `static properties` entries. */
function objectKeyName(key: TSESTree.Node): string | null {
  if (key.type === "Identifier") {
    return key.name;
  }
  return key.type === "Literal" && typeof key.value === "string" ? key.value : null;
}

/** Names declared by a `static properties = { … }` field or accessor. */
function staticPropertyNames(
  member: TSESTree.PropertyDefinition | TSESTree.AccessorProperty,
): string[] {
  if (
    !member.static ||
    keyName(member.key) !== "properties" ||
    member.value?.type !== "ObjectExpression"
  ) {
    return [];
  }
  const names: string[] = [];
  for (const entry of member.value.properties) {
    const name = entry.type === "Property" ? objectKeyName(entry.key) : null;
    if (name !== null) {
      names.push(name);
    }
  }
  return names;
}

/** Reactive property names, from decorators and from `static properties`. */
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
    for (const name of staticPropertyNames(member)) {
      names.add(name);
    }
  }
  return names;
}

/** Name of the property in `this.<name>`, or null for anything else. */
function thisPropertyName(node: TSESTree.Node): string | null {
  if (node.type !== "MemberExpression" || node.computed || node.object.type !== "ThisExpression") {
    return null;
  }
  const property = node.property;
  if (property.type === "Identifier") {
    return property.name;
  }
  return property.type === "PrivateIdentifier" ? `#${property.name}` : null;
}

/**
 * `no-array-mutation-without-reassign` — rejects calling a mutating array
 * method on a reactive property.
 *
 * Lit's default `hasChanged` compares with `!==`. A mutating array method
 * leaves the array identity untouched, so the property never looks changed and
 * no re-render is scheduled. Replace the array instead.
 */
export const noArrayMutationWithoutReassignRule: LitRule = {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow mutating array methods on reactive properties",
      url: docsUrl("no-array-mutation-without-reassign"),
    },
    hasSuggestions: true,
    schema: [],
    messages: {
      mutation:
        "Unexpected `this.{{name}}.{{method}}()`, which mutates a reactive property in place without Lit noticing.",
      reassign: "Assign a new array to `this.{{name}}` instead.",
    },
  },
  create(context) {
    const { sourceCode } = context;

    /**
     * The new array a statement-level `push` or `unshift` amounts to, or null.
     * Only a call used as a statement can be rewritten: its return value, the
     * new length, is otherwise read.
     */
    function replacement(
      node: TSESTree.CallExpression,
      receiver: string,
      method: string,
    ): string | null {
      if (node.parent.type !== "ExpressionStatement" || node.optional) {
        return null;
      }
      const items = node.arguments.map((argument) =>
        sourceCode.text.slice(argument.range[0], argument.range[1]),
      );
      const spread = `...this.${receiver}`;
      if (method === "push") {
        return `this.${receiver} = [${[spread, ...items].join(", ")}]`;
      }
      if (method === "unshift") {
        return `this.${receiver} = [${[...items, spread].join(", ")}]`;
      }
      return null;
    }

    return {
      CallExpression(node: TSESTree.CallExpression): void {
        const callee = node.callee;
        if (callee.type !== "MemberExpression" || callee.computed) {
          return;
        }
        const method = callee.property;
        if (method.type !== "Identifier" || !MUTATING_METHODS.has(method.name)) {
          return;
        }
        const receiver = thisPropertyName(callee.object);
        if (receiver === null) {
          return;
        }
        const classNode = enclosingClass(node);
        if (
          classNode === null ||
          !isLitComponent(classNode, context) ||
          !reactivePropertyNames(classNode).has(receiver)
        ) {
          return;
        }
        const data = { name: receiver, method: method.name };
        const text = replacement(node, receiver, method.name);
        context.report({
          node,
          messageId: "mutation",
          data,
          suggest:
            text === null
              ? []
              : [{ messageId: "reassign", data, fix: (fixer) => fixer.replaceText(node, text) }],
        });
      },
    };
  },
};
