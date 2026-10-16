import type { SuggestedEdit } from "@eslint/core";
import type { TSESTree } from "@typescript-eslint/types";

import type { ClassNode, LitRule, LitRuleContext } from "#helpers";
import {
  controllerHostField,
  controllerHostParam,
  docsUrl,
  enclosingClass,
  enclosingMethod,
  findConstructor,
  isLitComponent,
  isReactiveController,
  memberPath,
} from "#helpers";

/** A class in scope for the controller rules. */
function isControllerClass(node: ClassNode, context: LitRuleContext): boolean {
  return !isLitComponent(node, context) && isReactiveController(node);
}

/**
 * Spellings that name the host inside a controller: the parameter itself, and
 * whatever field the constructor stores it in. The parameter and field are
 * found by type, so registering through a renamed host still counts.
 */
function hostReceivers(owner: ClassNode): string[] {
  const receivers = ["host", "this.host", "this.#host"];
  const param = controllerHostParam(owner);
  if (param !== null) {
    receivers.push(param.name);
  }
  const field = controllerHostField(owner);
  if (field !== null) {
    receivers.push(`this.${field}`);
  }
  return receivers;
}

/** Whether a call is `host.addController(this)` in any accepted spelling. */
function isSelfRegistration(node: TSESTree.CallExpression, owner: ClassNode): boolean {
  const { callee } = node;
  if (callee.type !== "MemberExpression" || callee.computed) {
    return false;
  }
  if (memberPath(callee.property) !== "addController") {
    return false;
  }
  const receiver = memberPath(callee.object);
  if (receiver === null || !hostReceivers(owner).includes(receiver)) {
    return false;
  }
  return node.arguments.length === 1 && node.arguments[0]?.type === "ThisExpression";
}

/** The suggestion that appends the registration to the constructor body. */
function registerSuggestions(
  constructor: TSESTree.MethodDefinition | null,
  owner: ClassNode,
): SuggestedEdit[] {
  const param = controllerHostParam(owner);
  const body = constructor?.value.body ?? null;
  if (constructor === null || param === null || body === null) {
    return [];
  }
  const indent = " ".repeat(constructor.loc.start.column);
  const call = `${param.name}.addController(this);`;
  const last = body.body.at(-1);
  return [
    {
      messageId: "register",
      data: { host: param.name },
      fix: (fixer) =>
        last === undefined
          ? fixer.replaceTextRange(body.range, `{\n${indent}  ${call}\n${indent}}`)
          : fixer.insertTextAfterRange(last.range, `\n${indent}  ${call}`),
    },
  ];
}

/**
 * `self-registration` — a reactive controller registers itself.
 *
 * The host constructs it and forgets about it; the controller calls
 * `host.addController(this)` in its constructor so the host hooks fire
 * without the host wiring anything up.
 */
export const selfRegistrationRule: LitRule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Require a reactive controller to call `host.addController(this)` in its constructor",
      url: docsUrl("self-registration"),
    },
    hasSuggestions: true,
    schema: [],
    messages: {
      unregistered:
        "Expected reactive controller to call `host.addController(this)` in its constructor.",
      register: "Call `{{host}}.addController(this)` at the end of the constructor.",
    },
  },
  create(context) {
    const registered = new Set<ClassNode>();

    /** Reports a controller whose constructor never registered it. */
    function check(node: ClassNode): void {
      if (!isControllerClass(node, context) || registered.has(node)) {
        return;
      }
      const constructor = findConstructor(node);
      context.report({
        node: constructor?.key ?? node.id ?? node,
        messageId: "unregistered",
        suggest: registerSuggestions(constructor, node),
      });
    }

    return {
      CallExpression(node: TSESTree.CallExpression): void {
        const owner = enclosingClass(node);
        if (owner === null || !isSelfRegistration(node, owner)) {
          return;
        }
        if (enclosingMethod(node)?.kind !== "constructor") {
          return;
        }
        registered.add(owner);
      },
      "ClassDeclaration:exit"(node: TSESTree.ClassDeclaration): void {
        check(node);
      },
      "ClassExpression:exit"(node: TSESTree.ClassExpression): void {
        check(node);
      },
    };
  },
};
