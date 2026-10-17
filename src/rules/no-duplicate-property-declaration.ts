import type { TSESTree } from "@typescript-eslint/types";

import {
  classMembers,
  type ClassNode,
  docsUrl,
  isLitComponent,
  isReactiveProperty,
  keyName,
  type LitRule,
} from "#helpers";

/** Name of an object-literal key. */
function objectKeyName(key: TSESTree.Node): string | null {
  if (key.type === "Identifier") {
    return key.name;
  }
  return key.type === "Literal" && typeof key.value === "string" ? key.value : null;
}

/** Names declared by `@property`/`@state` decorators on a class. */
function decoratedNames(node: ClassNode): Set<string> {
  const names = new Set<string>();
  for (const member of classMembers(node)) {
    if (
      (member.type === "PropertyDefinition" || member.type === "AccessorProperty") &&
      isReactiveProperty(member)
    ) {
      const name = keyName(member.key);
      if (name !== null) {
        names.add(name);
      }
    }
  }
  return names;
}

/** The entries of every `static properties = { … }` field on a class. */
function staticPropertyEntries(node: ClassNode): TSESTree.Property[] {
  const entries: TSESTree.Property[] = [];
  for (const member of classMembers(node)) {
    if (
      member.type === "PropertyDefinition" &&
      member.static &&
      keyName(member.key) === "properties" &&
      member.value?.type === "ObjectExpression"
    ) {
      for (const entry of member.value.properties) {
        if (entry.type === "Property") {
          entries.push(entry);
        }
      }
    }
  }
  return entries;
}

/**
 * `no-duplicate-property-declaration` — rejects a property declared by both a
 * decorator and a `static properties` entry.
 *
 * `@property()` and `static properties` both end up in
 * `ReactiveElement.createProperty`. Declaring one property both ways means one
 * set of options silently wins, so the `type`, `reflect`, and `converter`
 * written in the losing declaration have no effect while still reading as
 * though they do.
 */
export const noDuplicatePropertyDeclarationRule: LitRule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow declaring a reactive property both by decorator and in `static properties`",
      url: docsUrl("no-duplicate-property-declaration"),
    },
    schema: [],
    messages: {
      duplicate:
        "Unexpected property `{{name}}` declared both by a decorator and by `static properties`; one options object silently overrides the other.",
    },
  },
  create(context) {
    function check(node: ClassNode): void {
      if (!isLitComponent(node, context)) {
        return;
      }
      const decorated = decoratedNames(node);
      if (decorated.size === 0) {
        return;
      }
      for (const entry of staticPropertyEntries(node)) {
        const name = objectKeyName(entry.key);
        if (name !== null && decorated.has(name)) {
          context.report({ node: entry.key, messageId: "duplicate", data: { name } });
        }
      }
    }

    return {
      ClassDeclaration: check,
      ClassExpression: check,
    };
  },
};
