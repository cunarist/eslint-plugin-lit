import type { TSESTree } from "@typescript-eslint/types";

import {
  docsUrl,
  enclosingClass,
  isLitComponent,
  parentOf,
  variableOf,
  type LitRule,
  type LitRuleContext,
} from "#helpers";

/** The component members that hold its rendered DOM. */
const ROOT_MEMBERS: ReadonlySet<string> = new Set(["renderRoot", "shadowRoot"]);

/** Lit's own packages, whose functions may take the render root. */
const LIT_SOURCE: RegExp = /^(?:lit|lit-html|lit-element|@lit\/[^/]+)(?:\/|$)/u;

/** Wrappers that pass a value through unchanged, as far as escaping goes. */
const PASS_THROUGH: ReadonlySet<string> = new Set([
  "TSNonNullExpression",
  "TSAsExpression",
  "TSSatisfiesExpression",
  "TSTypeAssertion",
  "LogicalExpression",
  "ConditionalExpression",
]);

/** How a value leaves the component, as a message id. */
type Escape = "argument" | "returned" | "stored";

/** The render root member a node reads, `this.renderRoot` or `this.shadowRoot`. */
function rootMemberName(node: TSESTree.MemberExpression): string | null {
  if (node.computed || node.object.type !== "ThisExpression") {
    return null;
  }
  const property = node.property;
  return property.type === "Identifier" && ROOT_MEMBERS.has(property.name) ? property.name : null;
}

/** The outermost expression that still carries the value of `node`. */
function carrier(node: TSESTree.Node): TSESTree.Node {
  let current = node;
  let parent = parentOf(current);
  while (parent !== null && PASS_THROUGH.has(parent.type)) {
    // A ternary's test is read, not passed on.
    if (parent.type === "ConditionalExpression" && parent.test === current) {
      return current;
    }
    current = parent;
    parent = parentOf(current);
  }
  return current;
}

/** Whether a callee is a function imported from one of Lit's packages. */
function isLitFunction(context: LitRuleContext, callee: TSESTree.Node): boolean {
  let name: TSESTree.Node = callee;
  // `lit.render(...)` through `import * as lit from "lit"`.
  if (name.type === "MemberExpression" && !name.computed) {
    name = name.object;
  }
  if (name.type !== "Identifier") {
    return false;
  }
  const definitions = variableOf(context, name)?.defs ?? [];
  return definitions.some((definition) => {
    const declaration = definition.parent;
    return (
      definition.type === "ImportBinding" &&
      declaration?.type === "ImportDeclaration" &&
      LIT_SOURCE.test(declaration.source.value)
    );
  });
}

/** Whether an assignment target stays on the component: `this.x` or `this.#x`. */
function isOwnMember(target: TSESTree.Node): boolean {
  return target.type === "MemberExpression" && target.object.type === "ThisExpression";
}

/** How the value at `node` leaves the component, or `null` if it stays. */
function escapeOf(context: LitRuleContext, node: TSESTree.Node): Escape | null {
  const parent = parentOf(node);
  switch (parent?.type) {
    case "CallExpression":
    case "NewExpression":
      return parent.callee !== node && !isLitFunction(context, parent.callee) ? "argument" : null;
    case "ReturnStatement":
    case "YieldExpression":
      return "returned";
    case "ArrowFunctionExpression":
      return parent.body === node ? "returned" : null;
    case "AssignmentExpression":
      return parent.right === node && !isOwnMember(parent.left) ? "stored" : null;
    case "Property":
      return parent.value === node && parent.parent.type === "ObjectExpression" ? "stored" : null;
    case "ArrayExpression":
      return "stored";
    default:
      return null;
  }
}

/** The local a `const root = this.renderRoot` declaration binds, if any. */
function aliasOf(node: TSESTree.Node): TSESTree.Identifier | null {
  const parent = parentOf(node);
  return parent?.type === "VariableDeclarator" &&
    parent.init === node &&
    parent.id.type === "Identifier"
    ? parent.id
    : null;
}

/**
 * `no-render-root-escape` - rejects a Lit component's render root leaving the
 * component: passed to a function, returned, or stored elsewhere.
 *
 * `no-dom-query` bans selector lookups inside a component, and handing
 * `this.renderRoot` to a helper that runs them moves the same lookup out of
 * its sight. Lit's own functions, such as `render` and `adoptStyles`, may
 * still take it.
 */
export const noRenderRootEscapeRule: LitRule = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Disallow a Lit component's render root escaping the component",
      url: docsUrl("no-render-root-escape"),
    },
    schema: [],
    messages: {
      argument: "Unexpected `{{name}}` passed to a function; reach elements through a `ref`.",
      returned:
        "Unexpected `{{name}}` returned from a Lit component; reach elements through a `ref`.",
      stored:
        "Unexpected `{{name}}` stored outside a Lit component; reach elements through a `ref`.",
    },
  },
  create(context) {
    /** Reports `node` if the value it carries leaves the component. */
    function check(node: TSESTree.Node, name: string): void {
      const outer = carrier(node);
      const escape = escapeOf(context, outer);
      if (escape !== null) {
        context.report({ node, messageId: escape, data: { name } });
        return;
      }
      // `const root = this.renderRoot;` escapes through each use of `root`.
      const alias = aliasOf(outer);
      const references = alias === null ? [] : (variableOf(context, alias)?.references ?? []);
      for (const reference of references) {
        if (reference.identifier !== alias) {
          check(reference.identifier, name);
        }
      }
    }

    return {
      MemberExpression(node: TSESTree.MemberExpression): void {
        const member = rootMemberName(node);
        if (member === null) {
          return;
        }
        const owner = enclosingClass(node);
        if (owner === null || !isLitComponent(owner, context)) {
          return;
        }
        check(node, `this.${member}`);
      },
    };
  },
};
