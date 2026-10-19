import type { TSESTree } from "@typescript-eslint/types";

import { docsUrl, enclosingClass, isLitComponent, type LitRule } from "#helpers";

/** Update-scheduling methods Lit exposes on `ReactiveElement`. */
const SCHEDULING_METHODS: ReadonlySet<string> = new Set([
  "requestUpdate",
  "performUpdate",
  "scheduleUpdate",
]);

/**
 * `no-manual-update` - a Lit component does not schedule its own renders.
 * `requestUpdate`, `performUpdate`, and `scheduleUpdate` on `this` mean some
 * state driving the template is not a reactive property.
 *
 * A `ReactiveController` nudging its host calls a different object, and a
 * controller is not a component, so it never reaches this rule. `super.` calls
 * are delegation, not manual scheduling, and are left alone.
 */
export const noManualUpdateRule: LitRule = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Disallow a Lit component scheduling its own updates",
      url: docsUrl("no-manual-update"),
    },
    schema: [],
    messages: {
      manualUpdate: "Unexpected manual update through `this.{{name}}()`.",
    },
  },
  create(context) {
    return {
      CallExpression(node: TSESTree.CallExpression): void {
        const callee = node.callee;
        // `this.x()` only: `super.x()` is delegation, a bare `x()` is a local.
        if (
          callee.type !== "MemberExpression" ||
          callee.computed ||
          callee.object.type !== "ThisExpression" ||
          callee.property.type !== "Identifier"
        ) {
          return;
        }
        const name = callee.property.name;
        if (!SCHEDULING_METHODS.has(name)) {
          return;
        }
        const owner = enclosingClass(node);
        if (owner === null || !isLitComponent(owner, context)) {
          return;
        }
        context.report({ node: callee, messageId: "manualUpdate", data: { name } });
      },
    };
  },
};
