import type { TSESTree } from "@typescript-eslint/types";

import { type ClassNode, docsUrl, isLitComponent, keyName, type LitRule } from "#helpers";

/**
 * Whether a returned value is `this`, directly or from a branch of a
 * conditional: `return cond ? this : super.createRenderRoot()`.
 */
function returnsIt(value: TSESTree.Node | null): boolean {
  if (value === null) {
    return false;
  }
  if (value.type === "ThisExpression") {
    return true;
  }
  if (value.type === "ConditionalExpression") {
    return returnsIt(value.consequent) || returnsIt(value.alternate);
  }
  return false;
}

/**
 * Whether a statement returns `this`, from anywhere inside it but never from
 * a nested function, which has its own `this`. Only the returned value counts:
 * `if (this.flat)` mentions `this` in a test, which says nothing about the
 * render root.
 */
function statementReturnsThis(node: TSESTree.Node | null): boolean {
  if (node === null) {
    return false;
  }
  switch (node.type) {
    case "ReturnStatement":
      return returnsIt(node.argument);
    case "BlockStatement":
      return node.body.some(statementReturnsThis);
    case "IfStatement":
      return statementReturnsThis(node.consequent) || statementReturnsThis(node.alternate);
    // Only the `try` block: a return from `catch` or `finally` is not looked at.
    case "TryStatement":
      return statementReturnsThis(node.block);
    case "SwitchStatement":
      return node.cases.some((switchCase) => switchCase.consequent.some(statementReturnsThis));
    case "ForStatement":
    case "ForInStatement":
    case "ForOfStatement":
    case "WhileStatement":
    case "DoWhileStatement":
    case "LabeledStatement":
      return statementReturnsThis(node.body);
    default:
      return false;
  }
}

/** Whether a function body returns `this`, directly or from a branch. */
function returnsThis(body: TSESTree.BlockStatement | TSESTree.Expression): boolean {
  if (body.type === "ThisExpression") {
    return true;
  }
  return body.type === "BlockStatement" && statementReturnsThis(body);
}

/**
 * `no-light-dom` — `createRenderRoot()` returning `this` renders into the light
 * DOM, which drops style and DOM encapsulation for the whole component.
 */
export const noLightDomRule: LitRule = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Disallow `createRenderRoot()` returning `this` in a Lit component",
      url: docsUrl("no-light-dom"),
    },
    schema: [],
    messages: {
      lightDom: "Unexpected `createRenderRoot()` returning `this`, which leaves no shadow root.",
    },
  },
  create(context) {
    function check(node: ClassNode): void {
      if (!isLitComponent(node, context)) {
        return;
      }
      for (const member of node.body.body) {
        if (member.type !== "MethodDefinition" || keyName(member.key) !== "createRenderRoot") {
          continue;
        }
        const body = member.value.body;
        if (body !== null && body !== undefined && returnsThis(body)) {
          context.report({ node: member, messageId: "lightDom" });
        }
      }
    }

    return {
      ClassDeclaration(node: TSESTree.ClassDeclaration): void {
        check(node);
      },
      ClassExpression(node: TSESTree.ClassExpression): void {
        check(node);
      },
    };
  },
};
