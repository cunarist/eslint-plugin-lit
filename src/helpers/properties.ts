/**
 * Reactive property lookups on a class: the `static properties` object, the
 * names it and the `@property`/`@state` decorators declare, and `this.<name>`
 * targets.
 */

import type { TSESTree } from "@typescript-eslint/types";

import { classMembers, type ClassNode, keyName } from "./ast.ts";
import { isReactiveProperty } from "./lit.ts";

/** Name of an object literal key, as `static properties` entries spell it. */
export function objectKeyName(key: TSESTree.Node): string | null {
  if (key.type === "Identifier") {
    return key.name;
  }
  if (key.type === "Literal" && typeof key.value === "string") {
    return key.value;
  }
  return null;
}

/**
 * The entries of a `static properties = { … }` member, or none when the member
 * is anything else or its value is not an object literal.
 */
export function staticPropertiesEntries(member: TSESTree.ClassElement): TSESTree.Property[] {
  if (
    member.type !== "PropertyDefinition" ||
    !member.static ||
    keyName(member.key) !== "properties" ||
    member.value?.type !== "ObjectExpression"
  ) {
    return [];
  }
  const entries: TSESTree.Property[] = [];
  for (const entry of member.value.properties) {
    if (entry.type === "Property") {
      entries.push(entry);
    }
  }
  return entries;
}

/** Reactive property names, from decorators and from `static properties`. */
export function reactivePropertyNames(node: ClassNode): Set<string> {
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
    for (const entry of staticPropertiesEntries(member)) {
      const name = objectKeyName(entry.key);
      if (name !== null) {
        names.add(name);
      }
    }
  }
  return names;
}

/** Name of the property in `this.<name>` or `this.#name`, or null for anything else. */
export function thisPropertyName(node: TSESTree.Node): string | null {
  if (node.type !== "MemberExpression" || node.computed || node.object.type !== "ThisExpression") {
    return null;
  }
  const property = node.property;
  if (property.type === "Identifier") {
    return property.name;
  }
  if (property.type === "PrivateIdentifier") {
    return `#${property.name}`;
  }
  return null;
}
