/**
 * Reactive controller detection: whether a class declares itself a
 * `ReactiveController`, and how it receives and stores its host.
 */

import type { TSESTree } from "@typescript-eslint/types";

import type { ClassNode } from "./ast.ts";
import { findConstructor, memberPath, typeReferenceName } from "./ast.ts";

/** Whether a class declares `implements ReactiveController`. */
export function hasReactiveControllerInterface(node: ClassNode): boolean {
  return (node.implements ?? []).some(
    (clause) => memberPath(clause.expression) === "ReactiveController",
  );
}

/**
 * Whether a class is a reactive controller.
 *
 * The only signal is the `implements ReactiveController` clause. Earlier this
 * also accepted a class name ending in `Controller`, which reported plain
 * classes called `GameController` and stayed silent on a controller called
 * anything else. A declaration the author wrote is a fact; a name is a guess.
 *
 * The cost is that a controller which omits the clause is never checked. That
 * is the honest trade: these rules apply to classes that declare themselves.
 */
export function isReactiveController(node: ClassNode): boolean {
  return hasReactiveControllerInterface(node);
}

/** The `ReactiveControllerHost` parameter in a constructor, by type not name. */
function hostParamOf(constructor: TSESTree.MethodDefinition): TSESTree.Identifier | null {
  for (const param of constructor.value.params) {
    if (
      param.type === "Identifier" &&
      typeReferenceName(param.typeAnnotation ?? null) === "ReactiveControllerHost"
    ) {
      return param;
    }
  }
  return null;
}

/**
 * The constructor parameter a controller receives its host through.
 *
 * Found by its `ReactiveControllerHost` type, not by the name `host`, so this
 * does not depend on `host-constructor` having enforced that name: a controller
 * may call the parameter anything.
 */
export function controllerHostParam(node: ClassNode): TSESTree.Identifier | null {
  const constructor = findConstructor(node);
  return constructor === null ? null : hostParamOf(constructor);
}

/**
 * The field a controller stores its host in, by name (`#host`, `host`, `_host`,
 * …), or null.
 *
 * The host parameter is found by type, then followed to a top-level
 * `this.<field> = host` assignment in the constructor. Anything more elaborate,
 * an intermediate alias (`const h = host; this.#host = h`), destructuring, or a
 * nested target (`this.state.host`), is unanalyzable and returns null; callers
 * skip the controller rather than guess. Returns null too when the host is not
 * stored at all, which is legitimate: a controller that only registers itself
 * needs no field.
 */
export function controllerHostField(node: ClassNode): string | null {
  const constructor = findConstructor(node);
  if (constructor === null) {
    return null;
  }
  const param = hostParamOf(constructor);
  const body = constructor.value.body;
  if (param === null || body === null) {
    return null;
  }
  for (const statement of body.body) {
    if (statement.type !== "ExpressionStatement") {
      continue;
    }
    const expression = statement.expression;
    if (
      expression.type !== "AssignmentExpression" ||
      expression.operator !== "=" ||
      expression.right.type !== "Identifier" ||
      expression.right.name !== param.name
    ) {
      continue;
    }
    const target = expression.left;
    if (
      target.type !== "MemberExpression" ||
      target.computed ||
      target.object.type !== "ThisExpression"
    ) {
      continue;
    }
    const property = target.property;
    if (property.type === "Identifier") {
      return property.name;
    }
    if (property.type === "PrivateIdentifier") {
      return `#${property.name}`;
    }
  }
  return null;
}
