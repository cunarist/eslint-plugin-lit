import type { TSESTree } from "@typescript-eslint/types";

import { docsUrl, enclosingClass, isLitComponent, keyName, type LitRule } from "#helpers";

/**
 * `no-async-render` — rejects an `async render()` on a Lit component.
 *
 * `render()` must return something Lit can commit synchronously. An `async`
 * render returns a Promise, which Lit renders as nothing.
 */
export const noAsyncRenderRule: LitRule = {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow an `async` `render()` on Lit components",
      url: docsUrl("no-async-render"),
    },
    schema: [],
    messages: {
      async:
        "Unexpected async `render()`; Lit cannot render a Promise, so the component renders nothing.",
    },
  },
  create(context) {
    return {
      MethodDefinition(node: TSESTree.MethodDefinition): void {
        if (node.static || node.kind !== "method" || !node.value.async) {
          return;
        }
        if (keyName(node.key) !== "render") {
          return;
        }
        const classNode = enclosingClass(node);
        if (classNode === null || !isLitComponent(classNode, context)) {
          return;
        }
        context.report({ node: node.key, messageId: "async" });
      },
    };
  },
};
