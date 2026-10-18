import type { TSESTree } from "@typescript-eslint/types";

import {
  docsUrl,
  isHtmlTemplate,
  isSimpleReference,
  keyName,
  type LitRule,
  memberPath,
  parentOf,
} from "#helpers";

/**
 * Names that are Lit directives. They get no exemption; the message only names
 * them accurately.
 */
const DIRECTIVE_NAMES: ReadonlySet<string> = new Set([
  "asyncAppend",
  "asyncReplace",
  "cache",
  "choose",
  "classMap",
  "guard",
  "ifDefined",
  "join",
  "keyed",
  "live",
  "map",
  "range",
  "ref",
  "repeat",
  "styleMap",
  "templateContent",
  "unsafeHTML",
  "unsafeMathML",
  "unsafeSVG",
  "until",
  "when",
]);

/** A report's message and the placeholders it fills. */
interface Shape {
  messageId: string;
  data: Record<string, string>;
}

/** A shape whose fix is to hoist the value into a local. */
function hoist(shape: string): Shape {
  return { messageId: "hoist", data: { shape } };
}

/** The trailing segment of a callee path, e.g. `bind` for `this.go.bind`. */
function calleeTail(node: TSESTree.CallExpression): string | null {
  const callee = node.callee;
  if (callee.type !== "MemberExpression" || callee.computed) {
    return null;
  }
  return memberPath(callee.property);
}

/** What kind of call a binding makes. */
function callShape(node: TSESTree.CallExpression): Shape {
  const tail = calleeTail(node);
  if (tail === "bind") {
    return { messageId: "bind", data: {} };
  }
  if (tail === "map") {
    return { messageId: "map", data: {} };
  }
  const name = memberPath(node.callee);
  if (name !== null && DIRECTIVE_NAMES.has(name)) {
    return { messageId: "directive", data: { name } };
  }
  return hoist("call expression");
}

/** What kind of expression a binding that is not a plain reference is. */
function classify(node: TSESTree.Expression): Shape {
  switch (node.type) {
    case "ArrowFunctionExpression":
      return { messageId: "inlineFunction", data: { shape: "inline arrow function" } };
    case "FunctionExpression":
      return { messageId: "inlineFunction", data: { shape: "inline function expression" } };
    case "CallExpression":
      return callShape(node);
    case "TaggedTemplateExpression":
      return hoist("nested tagged template");
    case "ConditionalExpression":
      return hoist("conditional expression");
    case "LogicalExpression":
      return hoist(`logical \`${node.operator}\` expression`);
    case "TemplateLiteral":
      return hoist("template literal");
    case "ObjectExpression":
      return hoist("object literal");
    case "ArrayExpression":
      return hoist("array literal");
    case "AwaitExpression":
      return hoist("`await` expression");
    case "MemberExpression":
      return hoist("computed member access");
    case "BinaryExpression":
      return hoist(`binary \`${node.operator}\` expression`);
    case "NewExpression":
      return hoist("`new` expression");
    default:
      return hoist("complex expression");
  }
}

/** A function-like node, which ends the "directly inside `render()`" chain. */
type FunctionNode =
  | TSESTree.ArrowFunctionExpression
  | TSESTree.FunctionExpression
  | TSESTree.FunctionDeclaration;

/** Nearest enclosing function-like node, or null. */
function enclosingFunction(node: TSESTree.Node): FunctionNode | null {
  let current: TSESTree.Node | null = node;
  while (current !== null) {
    if (
      current.type === "ArrowFunctionExpression" ||
      current.type === "FunctionExpression" ||
      current.type === "FunctionDeclaration"
    ) {
      return current;
    }
    current = parentOf(current);
  }
  return null;
}

/** Whether a return statement belongs directly to a `render()` method. */
function isRenderReturn(node: TSESTree.ReturnStatement): boolean {
  const parent = enclosingFunction(node)?.parent;
  return parent?.type === "MethodDefinition" && keyName(parent.key) === "render";
}

/**
 * `simple-template-expressions` — every `${…}` binding in an `html` template
 * must be an identifier, `this`, or a non-computed member chain of any depth.
 *
 * Calls (directive calls included), inline functions, `.bind(this)`,
 * `.map(…)`, conditionals, logical operators, literals, and `await` are
 * computed before the `return` and interpolated by name. The expression
 * `render()` returns may not be a conditional either.
 */
export const simpleTemplateExpressionsRule: LitRule = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Enforce plain names and member chains as template bindings",
      url: docsUrl("simple-template-expressions"),
    },
    schema: [],
    messages: {
      hoist:
        "Unexpected {{shape}} in a template; compute it before the `return` and interpolate the local by name.",
      inlineFunction:
        "Unexpected {{shape}} in a template; make it a private method field such as `readonly #onClick = () => {…}` and bind it by name.",
      bind: "Unexpected `.bind(this)` in a template; make it a private method field such as `readonly #onClick = () => {…}` and bind it by name.",
      map: "Unexpected `.map(…)` call in a template; build the list with `repeat(…)` hoisted into a local and interpolate the local.",
      directive:
        "Unexpected directive call `{{name}}(…)` in a template; directives are hoisted out too, into a local before the `return`.",
      conditionalRender:
        "Unexpected conditional expression returned from `render()`; return early inside an `if`, or precompute the template into a local.",
    },
  },
  create(context) {
    return {
      TaggedTemplateExpression(node: TSESTree.TaggedTemplateExpression): void {
        if (!isHtmlTemplate(node, context)) {
          return;
        }
        for (const expression of node.quasi.expressions) {
          if (isSimpleReference(expression)) {
            continue;
          }
          const shape = classify(expression);
          context.report({ node: expression, messageId: shape.messageId, data: shape.data });
        }
      },
      ReturnStatement(node: TSESTree.ReturnStatement): void {
        if (node.argument?.type === "ConditionalExpression" && isRenderReturn(node)) {
          context.report({ node: node.argument, messageId: "conditionalRender" });
        }
      },
    };
  },
};
