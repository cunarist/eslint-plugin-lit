/**
 * Generic AST helpers.
 *
 * Both ESLint (through `@typescript-eslint/parser`) and Oxlint hand rules a
 * TypeScript-ESTree tree, typed here by `TSESTree`. Access fields by name
 * rather than walking `Object.keys(node)`: Oxlint deserializes the tree
 * lazily, so generic traversal is slow and not guaranteed to see every field.
 */

import type { TSESTree } from "@typescript-eslint/types";

/** A class, declared or written as an expression. */
export type ClassNode = TSESTree.ClassDeclaration | TSESTree.ClassExpression;

/** A class member, as typed by `ClassBody`. */
export type ClassMember = TSESTree.ClassElement;

/** Name of a key node (`Identifier`, `PrivateIdentifier`, or string literal). */
export function keyName(key: TSESTree.Node | null): string | null {
  if (key === null) {
    return null;
  }
  switch (key.type) {
    case "Identifier":
      return key.name;
    case "PrivateIdentifier":
      return `#${key.name}`;
    case "Literal":
      return typeof key.value === "string" ? key.value : null;
    default:
      return null;
  }
}

/** Dotted source text of a static member expression, e.g. `this.host.foo`. */
export function memberPath(node: TSESTree.Node): string | null {
  switch (node.type) {
    case "Identifier":
      return node.name;
    case "PrivateIdentifier":
      return `#${node.name}`;
    case "ThisExpression":
      return "this";
    case "MemberExpression": {
      if (node.computed) {
        return null;
      }
      const object = memberPath(node.object);
      const property = memberPath(node.property);
      if (object === null || property === null) {
        return null;
      }
      return `${object}.${property}`;
    }
    default:
      return null;
  }
}

/**
 * Whether a node is a "simple" reference: an identifier, `this`, or a
 * non-computed member chain of any depth. Computed access is not simple.
 */
export function isSimpleReference(node: TSESTree.Node): boolean {
  return memberPath(node) !== null;
}

/** The callee name of a call expression, e.g. `repeat` or `this.foo.bar`. */
export function calleeName(node: TSESTree.CallExpression): string | null {
  return memberPath(node.callee);
}

/** The name a decorator is written with, called (`@a()`) or not (`@a`). */
function decoratorName(decorator: TSESTree.Decorator): string | null {
  const expression = decorator.expression;
  return expression.type === "CallExpression"
    ? memberPath(expression.callee)
    : memberPath(expression);
}

/** Decorators attached to a class, method, or property, by name. */
export function decoratorNames(decorators: TSESTree.Decorator[]): string[] {
  const names: string[] = [];
  for (const decorator of decorators) {
    const name = decoratorName(decorator);
    if (name !== null) {
      names.push(name);
    }
  }
  return names;
}

/** Find a decorator by name on a class, method, or property. */
export function findDecorator(
  decorators: TSESTree.Decorator[],
  name: string,
): TSESTree.Decorator | null {
  return decorators.find((decorator) => decoratorName(decorator) === name) ?? null;
}

/** Decorators on a class. */
export function classDecorators(node: ClassNode): TSESTree.Decorator[] {
  return node.decorators;
}

/**
 * A node's parent, or null at the root. The typescript-eslint types say
 * `Program.parent` is undefined, but ESLint and Oxlint both set it to null at
 * runtime, so every upward walk goes through here and stops on null alone.
 */
export function parentOf(node: TSESTree.Node): TSESTree.Node | null {
  return node.parent ?? null;
}

/** Nearest enclosing class, or null if the node is not inside a class. */
export function enclosingClass(node: TSESTree.Node): ClassNode | null {
  let current: TSESTree.Node | null = node;
  while (current !== null) {
    if (current.type === "ClassDeclaration" || current.type === "ClassExpression") {
      return current;
    }
    current = parentOf(current);
  }
  return null;
}

/**
 * Nearest enclosing method definition, or null. Used to answer "are we inside
 * `render()`?" without a manual stack.
 */
export function enclosingMethod(node: TSESTree.Node): TSESTree.MethodDefinition | null {
  let current: TSESTree.Node | null = node;
  while (current !== null) {
    if (current.type === "MethodDefinition") {
      return current;
    }
    if (current.type === "ClassDeclaration" || current.type === "ClassExpression") {
      return null;
    }
    current = parentOf(current);
  }
  return null;
}

/** Whether `node` sits inside a method with the given name. */
export function isInsideMethod(node: TSESTree.Node, name: string): boolean {
  const method = enclosingMethod(node);
  return method !== null && keyName(method.key) === name;
}

/** The members of a class body. */
export function classMembers(node: ClassNode): ClassMember[] {
  return node.body.body;
}

/** Find a named method on a class. */
export function findMethod(node: ClassNode, name: string): TSESTree.MethodDefinition | null {
  for (const member of classMembers(node)) {
    if (member.type === "MethodDefinition" && keyName(member.key) === name) {
      return member;
    }
  }
  return null;
}

/** Find a named property on a class. */
export function findProperty(node: ClassNode, name: string): TSESTree.PropertyDefinition | null {
  for (const member of classMembers(node)) {
    if (member.type === "PropertyDefinition" && keyName(member.key) === name) {
      return member;
    }
  }
  return null;
}

/** The constructor of a class, if it defines one. */
export function findConstructor(node: ClassNode): TSESTree.MethodDefinition | null {
  for (const member of classMembers(node)) {
    if (member.type === "MethodDefinition" && member.kind === "constructor") {
      return member;
    }
  }
  return null;
}

/** Name of the type in a `: SomeType` annotation, if it is a plain reference. */
export function typeReferenceName(annotation: TSESTree.TSTypeAnnotation | null): string | null {
  const inner = annotation?.typeAnnotation;
  if (inner?.type !== "TSTypeReference") {
    return null;
  }
  const name = inner.typeName;
  if (name.type === "Identifier") {
    return name.name;
  }
  if (name.type === "TSQualifiedName") {
    return name.right.name;
  }
  return null;
}

/** Convert `PathBar` to `path-bar`. */
export function pascalToKebab(name: string): string {
  return name
    .replaceAll(/(?<lower>[a-z0-9])(?<upper>[A-Z])/gu, "$1-$2")
    .replaceAll(/(?<run>[A-Z]+)(?<word>[A-Z][a-z])/gu, "$1-$2")
    .toLowerCase();
}

/** Convert `path-bar` to `PathBar`. */
export function kebabToPascal(name: string): string {
  return name
    .split("-")
    .filter((part) => part.length > 0)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
}
