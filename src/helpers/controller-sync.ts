/**
 * Class scope tracking for the controller sync rules, `no-self-sync` and
 * `no-sync-in-render`: which classes are Lit components or reactive
 * controllers, which host fields hold a controller, and which calls are a
 * controller's `sync*()`.
 *
 * Unlike `isLitComponent`, this detection stays inside the linted file. A class
 * is a Lit component when it extends `LitElement`, `ReactiveElement`, or
 * `UpdatingElement`, a local name imported for `LitElement` from `lit`, or a
 * component class declared earlier in the same file.
 */

import type { RuleVisitor } from "@eslint/core";
import type { TSESTree } from "@typescript-eslint/types";

import type { ClassMember, ClassNode } from "./ast.ts";
import { memberPath } from "./ast.ts";
import { hasReactiveControllerInterface } from "./controllers.ts";

/**
 * Enclosing classes and methods, innermost last. An enter/exit stack answers
 * "which class and method am I in" without walking `parent` links.
 */
export type SyncScopeNode = ClassNode | TSESTree.MethodDefinition;

/** A `this.<field>.sync*()` call, split into receiver field and method name. */
export interface ControllerSyncCall {
  field: string;
  method: string;
}

/** Base classes that make a subclass a Lit component. */
const LIT_COMPONENT_BASE_NAMES: string[] = ["LitElement", "ReactiveElement", "UpdatingElement"];

/**
 * Names ending in `Controller` that are not reactive controllers. Lit's own
 * types are contracts, and the platform ships several `*Controller` classes
 * that a reactive controller legitimately owns, `AbortController` above all.
 */
const NON_REACTIVE_CONTROLLER_NAMES: Set<string> = new Set([
  "ReactiveController",
  "ReactiveControllerHost",
  "AbortController",
  "ReadableStreamDefaultController",
  "ReadableByteStreamController",
  "WritableStreamDefaultController",
  "TransformStreamDefaultController",
]);

/** The starting set of Lit component base names, which a file then extends. */
export function litComponentBaseNames(): Set<string> {
  return new Set(LIT_COMPONENT_BASE_NAMES);
}

/**
 * The name of a key or member node, without the `#` of a private name: an
 * identifier, a private identifier, or a string literal.
 */
function plainName(node: TSESTree.Node): string | null {
  if (node.type === "Identifier" || node.type === "PrivateIdentifier") {
    return node.name;
  }
  return node.type === "Literal" && typeof node.value === "string" ? node.value : null;
}

/** The plain name of a property, accessor, or method, or null. */
function memberName(node: ClassMember): string | null {
  if (
    node.type !== "AccessorProperty" &&
    node.type !== "MethodDefinition" &&
    node.type !== "PropertyDefinition"
  ) {
    return null;
  }
  return plainName(node.key);
}

function superClassName(node: ClassNode): string | null {
  const { superClass } = node;
  return superClass?.type === "Identifier" ? superClass.name : null;
}

function registerLitComponentImports(node: TSESTree.ImportDeclaration, bases: Set<string>): void {
  for (const specifier of node.specifiers) {
    if (
      node.source.value === "lit" &&
      specifier.type === "ImportSpecifier" &&
      plainName(specifier.imported) === "LitElement"
    ) {
      bases.add(specifier.local.name);
    }
  }
}

/** Whether a class extends one of the file's known Lit component bases. */
export function isLocalLitComponent(node: ClassNode, bases: Set<string>): boolean {
  const name = superClassName(node);
  return name !== null && bases.has(name);
}

function registerLitComponentSubclass(node: TSESTree.ClassDeclaration, bases: Set<string>): void {
  if (isLocalLitComponent(node, bases) && node.id !== null) {
    bases.add(node.id.name);
  }
}

function looksLikeReactiveController(node: ClassNode): boolean {
  if (hasReactiveControllerInterface(node)) {
    return true;
  }
  if (node.id !== null && node.id.name.endsWith("Controller")) {
    return true;
  }
  return node.body.body.some((member) => {
    const name = memberName(member);
    return (
      member.type === "MethodDefinition" &&
      (name === "hostConnected" || name === "hostDisconnected")
    );
  });
}

/**
 * Whether a class is in scope as a reactive controller: it declares the
 * interface, is named `*Controller`, or defines a host hook, and is not itself
 * a Lit component.
 */
export function isSyncingController(node: ClassNode, bases: Set<string>): boolean {
  return !isLocalLitComponent(node, bases) && looksLikeReactiveController(node);
}

/**
 * Whether a `new` expression constructs a reactive controller. Platform classes
 * ending in `Controller` are excluded, so a `new AbortController()` is not
 * mistaken for one.
 */
function isControllerConstruction(node: TSESTree.Node | null): boolean {
  if (node?.type !== "NewExpression") {
    return false;
  }
  const path = memberPath(node.callee);
  const name = path === null ? null : (path.split(".").pop() ?? path).replace(/^#/u, "");
  return name !== null && !NON_REACTIVE_CONTROLLER_NAMES.has(name) && name.endsWith("Controller");
}

function addHostControllerField(
  fields: Set<string>,
  name: string | null,
  value: TSESTree.Node | null,
): void {
  if (name === null) {
    return;
  }
  if (name.toLowerCase().endsWith("controller") || isControllerConstruction(value)) {
    fields.add(name);
  }
}

function collectConstructorControllerFields(
  fields: Set<string>,
  constructor: TSESTree.MethodDefinition,
): void {
  const { body } = constructor.value;
  if (body === null) {
    return;
  }
  for (const statement of body.body) {
    if (statement.type !== "ExpressionStatement") {
      continue;
    }
    const { expression } = statement;
    if (
      expression.type === "AssignmentExpression" &&
      expression.operator === "=" &&
      expression.left.type === "MemberExpression" &&
      expression.left.object.type === "ThisExpression"
    ) {
      addHostControllerField(fields, plainName(expression.left.property), expression.right);
    }
  }
}

/**
 * Host fields that hold a reactive controller, by plain name: named
 * `*controller`, or initialized with a `new *Controller(...)`, whether in a
 * field initializer or in the constructor body.
 */
export function hostControllerFields(node: ClassNode): Set<string> {
  const fields = new Set<string>();
  for (const member of node.body.body) {
    if (member.type === "PropertyDefinition" || member.type === "AccessorProperty") {
      addHostControllerField(fields, memberName(member), member.value);
    } else if (member.type === "MethodDefinition" && member.kind === "constructor") {
      collectConstructorControllerFields(fields, member);
    }
  }
  return fields;
}

/** The field and method of a `this.<field>.sync*()` call, if it is one. */
export function controllerSyncCall(node: TSESTree.CallExpression): ControllerSyncCall | null {
  const { callee } = node;
  if (
    callee.type !== "MemberExpression" ||
    callee.computed ||
    callee.property.type !== "Identifier" ||
    !callee.property.name.startsWith("sync")
  ) {
    return null;
  }
  const receiver = callee.object;
  if (
    receiver.type !== "MemberExpression" ||
    receiver.computed ||
    receiver.object.type !== "ThisExpression"
  ) {
    return null;
  }
  const field = plainName(receiver.property);
  return field === null ? null : { field, method: callee.property.name };
}

/** The innermost class on the stack, or null outside every class. */
export function stackClass(stack: SyncScopeNode[]): ClassNode | null {
  for (let index = stack.length - 1; index >= 0; index -= 1) {
    const entry = stack[index];
    if (entry !== undefined && entry.type !== "MethodDefinition") {
      return entry;
    }
  }
  return null;
}

/** Whether the innermost entry on the stack is a method with this name. */
export function isStackInMethod(stack: SyncScopeNode[], name: string): boolean {
  const innermost = stack.at(-1);
  return innermost?.type === "MethodDefinition" && memberName(innermost) === name;
}

/** Visitors that keep the class stack and learn the file's Lit component bases. */
export function classStackVisitors(stack: SyncScopeNode[], bases: Set<string>): RuleVisitor {
  return {
    ImportDeclaration(node: TSESTree.ImportDeclaration): void {
      registerLitComponentImports(node, bases);
    },
    ClassDeclaration(node: TSESTree.ClassDeclaration): void {
      registerLitComponentSubclass(node, bases);
      stack.push(node);
    },
    "ClassDeclaration:exit"(): void {
      stack.pop();
    },
    ClassExpression(node: TSESTree.ClassExpression): void {
      stack.push(node);
    },
    "ClassExpression:exit"(): void {
      stack.pop();
    },
  };
}
