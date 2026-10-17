import type { SuggestedEdit } from "@eslint/core";
import type { TSESTree } from "@typescript-eslint/types";

import type { LitRule, LitRuleContext } from "#helpers";
import { docsUrl, enclosingMethod, isLitComponent, keyName } from "#helpers";

/**
 * Lifecycle methods whose overrides must chain to `super`.
 *
 * Only hooks whose base implementation does real work are listed.
 * `willUpdate`, `firstUpdated`, and `updated` are deliberately excluded:
 * `ReactiveElement` defines them as empty hooks precisely so subclasses can
 * override them without chaining. `shouldUpdate` and `render` are excluded for
 * the same reason; they are meant to be replaced, not extended.
 */
const REQUIRES_SUPER: ReadonlySet<string> = new Set([
  "connectedCallback",
  "disconnectedCallback",
  "attributeChangedCallback",
  "adoptedCallback",
  "update",
  "performUpdate",
]);

/** The method a `super.x()` call chains to, or null. */
function superCallName(node: TSESTree.CallExpression): string | null {
  const callee = node.callee;
  if (callee.type !== "MemberExpression" || callee.computed || callee.object.type !== "Super") {
    return null;
  }
  return callee.property.type === "Identifier" ? callee.property.name : null;
}

/** How a parameter is passed on to `super`, or null when it cannot be. */
function forwardedArgument(param: TSESTree.Parameter): string | null {
  switch (param.type) {
    case "Identifier":
      return param.name;
    case "AssignmentPattern":
      return param.left.type === "Identifier" ? param.left.name : null;
    case "RestElement":
      return param.argument.type === "Identifier" ? `...${param.argument.name}` : null;
    default:
      return null;
  }
}

/** The `super.name(…)` call forwarding every parameter, or null. */
function superCall(name: string, params: TSESTree.Parameter[]): string | null {
  const args: string[] = [];
  for (const param of params) {
    const argument = forwardedArgument(param);
    if (argument === null) {
      return null;
    }
    args.push(argument);
  }
  return `super.${name}(${args.join(", ")});`;
}

/**
 * The lifecycle name an override must chain to `super` for and does not, or
 * null when the method is fine or not an override of a Lit component's hook.
 */
function unchainedName(
  context: LitRuleContext,
  chained: ReadonlySet<TSESTree.MethodDefinition>,
  node: TSESTree.MethodDefinition,
): string | null {
  if (node.static || node.kind !== "method") {
    return null;
  }
  const name = keyName(node.key);
  if (name === null || !REQUIRES_SUPER.has(name)) {
    return null;
  }
  const classNode = node.parent.parent;
  if (classNode.type !== "ClassDeclaration" && classNode.type !== "ClassExpression") {
    return null;
  }
  if (chained.has(node) || !isLitComponent(classNode, context)) {
    return null;
  }
  return name;
}

/** The suggestion to call `super.name(…)` first, when the method can take it. */
function callSuperSuggestions(node: TSESTree.MethodDefinition, name: string): SuggestedEdit[] {
  const body = node.value.body;
  const call = superCall(name, node.value.params);
  if (body === null || body === undefined || call === null) {
    return [];
  }
  return [
    {
      messageId: "callSuper",
      data: { name },
      fix: (fixer) => {
        const first = body.body[0];
        if (first === undefined) {
          return fixer.replaceTextRange(body.range, `{ ${call} }`);
        }
        const indent = " ".repeat(first.loc.start.column);
        return fixer.insertTextBeforeRange(first.range, `${call}\n${indent}`);
      },
    },
  ];
}

/**
 * `lifecycle-super` — rejects an override of a Lit lifecycle callback that
 * never calls its own `super` implementation.
 *
 * `ReactiveElement` does real work in each of these callbacks: registering the
 * element, applying attribute changes, committing the render. An override that
 * never calls `super` silently removes that work.
 */
export const lifecycleSuperRule: LitRule = {
  meta: {
    type: "problem",
    docs: {
      description: "Require Lit lifecycle overrides to call their `super` implementation",
      url: docsUrl("lifecycle-super"),
    },
    hasSuggestions: true,
    schema: [],
    messages: {
      missing: "Expected `{{name}}()` to call `super.{{name}}()`, so Lit's own `{{name}}()` runs.",
      callSuper: "Call `super.{{name}}()` first.",
    },
  },
  create(context) {
    /** Methods seen calling their own `super` implementation. */
    const chained = new Set<TSESTree.MethodDefinition>();

    return {
      CallExpression(node: TSESTree.CallExpression): void {
        const name = superCallName(node);
        if (name === null) {
          return;
        }
        const method = enclosingMethod(node);
        if (method !== null && keyName(method.key) === name) {
          chained.add(method);
        }
      },

      "MethodDefinition:exit"(node: TSESTree.MethodDefinition): void {
        const name = unchainedName(context, chained, node);
        if (name === null) {
          return;
        }
        context.report({
          node: node.key,
          messageId: "missing",
          data: { name },
          suggest: callSuperSuggestions(node, name),
        });
      },
    };
  },
};
