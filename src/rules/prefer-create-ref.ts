import type { TSESTree } from "@typescript-eslint/types";

import {
  docsUrl,
  enclosingClass,
  findMethod,
  findProperty,
  isSimpleReference,
  keyName,
  type LitRule,
} from "#helpers";

/** A callback the `ref` directive could receive. */
type Callback =
  | TSESTree.ArrowFunctionExpression
  | TSESTree.FunctionExpression
  | TSESTree.FunctionDeclaration;

/**
 * Whether an expression's value is the callback parameter itself, reached
 * through any identity-preserving wrapper: a cast, `!`, the left of `?? …`, or
 * either branch of a `?:`. A projection of the element — `el.offsetWidth`,
 * `wrap(el)` — is deliberately not, because that value is no longer the
 * element and `createRef` could not hold it.
 */
function isParamValue(expression: TSESTree.Expression, param: string): boolean {
  switch (expression.type) {
    case "Identifier":
      return expression.name === param;
    case "TSAsExpression":
    case "TSNonNullExpression":
      return isParamValue(expression.expression, param);
    case "LogicalExpression":
      return expression.operator === "??" && isParamValue(expression.left, param);
    case "ConditionalExpression":
      return (
        isParamValue(expression.consequent, param) || isParamValue(expression.alternate, param)
      );
    default:
      return false;
  }
}

/** The single `=` assignment a callback's body reduces to, or null. */
function bodyAssignment(callback: Callback): TSESTree.AssignmentExpression | null {
  const body = callback.body;
  let expression: TSESTree.Expression;
  if (body.type === "BlockStatement") {
    const [statement] = body.body;
    if (body.body.length !== 1 || statement?.type !== "ExpressionStatement") {
      return null;
    }
    expression = statement.expression;
  } else {
    expression = body;
  }
  if (expression.type !== "AssignmentExpression" || expression.operator !== "=") {
    return null;
  }
  return expression;
}

/** Whether a callback does nothing but stash its own parameter. */
function isPureStash(callback: Callback): boolean {
  const [param] = callback.params;
  if (param?.type !== "Identifier") {
    return false;
  }
  const assignment = bodyAssignment(callback);
  return (
    assignment !== null &&
    isSimpleReference(assignment.left) &&
    isParamValue(assignment.right, param.name)
  );
}

/** Whether a function binds `name` as a parameter, shadowing outer scopes. */
function bindsParam(callback: Callback, name: string): boolean {
  return callback.params.some((param) => param.type === "Identifier" && param.name === name);
}

/** What declaring `name` in one statement amounts to. */
interface ScopeMatch {
  count: number;
  match: Callback | null;
}

/** The declarations of `name` that one statement makes. */
function scanStatement(statement: TSESTree.Node, name: string, found: ScopeMatch): void {
  const declaration =
    statement.type === "ExportNamedDeclaration" && statement.declaration !== null
      ? statement.declaration
      : statement;
  if (declaration.type === "FunctionDeclaration" && declaration.id?.name === name) {
    found.count += 1;
    found.match = declaration;
    return;
  }
  if (declaration.type !== "VariableDeclaration") {
    return;
  }
  for (const declarator of declaration.declarations) {
    if (declarator.id.type !== "Identifier" || declarator.id.name !== name) {
      continue;
    }
    found.count += 1;
    const init = declarator.init;
    found.match =
      declaration.kind === "const" &&
      (init?.type === "ArrowFunctionExpression" || init?.type === "FunctionExpression")
        ? init
        : null;
  }
}

/**
 * The lone `const name = <fn>` or `function name` in a statement list, or
 * `null` when the name is declared here but not as a plain function (a `let`,
 * a reassignable binding, a redeclaration), or `undefined` when not declared
 * in this scope at all.
 */
function scanScope(statements: TSESTree.Node[], name: string): Callback | null | undefined {
  const found: ScopeMatch = { count: 0, match: null };
  for (const statement of statements) {
    scanStatement(statement, name, found);
  }
  if (found.count === 0) {
    return undefined;
  }
  return found.count > 1 ? null : found.match;
}

/** Trace a bare identifier to the function it names, in the same file only. */
function resolveIdentifier(start: TSESTree.Node, name: string): Callback | null {
  let current: TSESTree.Node | undefined = start;
  while (current !== undefined) {
    if (
      (current.type === "ArrowFunctionExpression" ||
        current.type === "FunctionExpression" ||
        current.type === "FunctionDeclaration") &&
      bindsParam(current, name)
    ) {
      return null;
    }
    if (current.type === "BlockStatement" || current.type === "Program") {
      const found = scanScope(current.body, name);
      if (found !== undefined) {
        return found;
      }
    }
    current = current.parent ?? undefined;
  }
  return null;
}

/** The function a `this.name` member of the enclosing class holds, or null. */
function resolveMember(member: TSESTree.MemberExpression, call: TSESTree.Node): Callback | null {
  if (member.computed || member.object.type !== "ThisExpression") {
    return null;
  }
  const name = keyName(member.property);
  const owner = enclosingClass(call);
  if (name === null || owner === null) {
    return null;
  }
  const method = findMethod(owner, name);
  if (method?.kind === "method" && method.value.type === "FunctionExpression") {
    return method.value;
  }
  const value = findProperty(owner, name)?.value;
  if (value?.type === "ArrowFunctionExpression" || value?.type === "FunctionExpression") {
    return value;
  }
  return null;
}

/** Resolve the `ref(...)` argument to a callback function, or null. */
function resolveCallback(
  argument: TSESTree.CallExpressionArgument,
  call: TSESTree.CallExpression,
): Callback | null {
  switch (argument.type) {
    case "ArrowFunctionExpression":
    case "FunctionExpression":
      return argument;
    case "MemberExpression":
      return resolveMember(argument, call);
    case "Identifier":
      return resolveIdentifier(call, argument.name);
    default:
      return null;
  }
}

/**
 * `prefer-create-ref` — rejects a `ref` callback that only stashes the
 * element, in favour of `createRef`.
 *
 * Only fires when the callback is provably a bare stash: its body is one
 * assignment whose stored value is the element itself, reached through any
 * cast, `!`, `?? …`, or `?:` branch. The callback is resolved within the same
 * file only: an inline function, a `this` member of the enclosing class, or a
 * free identifier traced to its one declaration. Anything ambiguous is passed
 * over rather than guessed.
 */
export const preferCreateRefRule: LitRule = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Enforce `createRef` over a `ref` callback that only stashes the element",
      url: docsUrl("prefer-create-ref"),
    },
    schema: [],
    messages: {
      stash: "Unexpected `ref` callback that only stashes the element.",
    },
  },
  create(context) {
    return {
      CallExpression(node: TSESTree.CallExpression): void {
        const callee = node.callee;
        if (callee.type !== "Identifier" || callee.name !== "ref") {
          return;
        }
        const [argument] = node.arguments;
        if (argument === undefined || argument.type === "SpreadElement") {
          return;
        }
        const callback = resolveCallback(argument, node);
        if (callback !== null && isPureStash(callback)) {
          context.report({ node, messageId: "stash" });
        }
      },
    };
  },
};
