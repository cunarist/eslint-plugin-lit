import type { TSESTree } from "@typescript-eslint/types";

import { docsUrl, enclosingClass, isLitComponent, keyName } from "#helpers";
import type { LitRule } from "#helpers";

/**
 * Whether `node` sits inside a `static styles` initializer.
 *
 * The walk stops at a non-arrow function boundary: `this` is rebound there, so
 * it no longer refers to the static context.
 */
function inStaticStylesInitializer(node: TSESTree.Node): boolean {
  let current: TSESTree.Node | undefined = node;
  let child: TSESTree.Node | undefined;
  while (current !== undefined) {
    if (current.type === "FunctionExpression" || current.type === "FunctionDeclaration") {
      return false;
    }
    if (current.type === "PropertyDefinition") {
      // Only the initializer counts, not a computed key.
      return (
        current.static &&
        keyName(current.key) === "styles" &&
        current.value !== null &&
        current.value === child
      );
    }
    child = current;
    current = current.parent;
  }
  return false;
}

/**
 * `no-this-in-static-styles` — rejects `this` inside a `static styles`
 * initializer.
 *
 * `static styles` is evaluated once on the class, so `this` there is the
 * constructor and any per-instance value read through it is undefined.
 */
export const noThisInStaticStylesRule: LitRule = {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow `this` inside `static styles`",
      url: docsUrl("no-this-in-static-styles"),
    },
    schema: [],
    messages: {
      staticThis: "Unexpected `this` inside static styles, where there is no instance.",
    },
  },
  create(context) {
    return {
      ThisExpression(node: TSESTree.ThisExpression): void {
        if (!inStaticStylesInitializer(node)) {
          return;
        }
        const classNode = enclosingClass(node);
        if (classNode === null || !isLitComponent(classNode, context)) {
          return;
        }
        context.report({ node, messageId: "staticThis" });
      },
    };
  },
};
