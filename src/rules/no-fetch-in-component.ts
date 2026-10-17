import type { TSESTree } from "@typescript-eslint/types";

import { docsUrl, enclosingClass, isLitComponent, type LitRule, memberPath } from "#helpers";

/** The spellings of the global `fetch`. */
const FETCH_PATHS: ReadonlySet<string> = new Set([
  "fetch",
  "globalThis.fetch",
  "window.fetch",
  "self.fetch",
]);

/**
 * `no-fetch-in-component` — a component renders; it does not own a request.
 *
 * Nothing in a component's lifecycle cancels an in-flight `fetch`, so the
 * response arrives on a disconnected element. The request belongs to a
 * `ReactiveController` that aborts it in `hostDisconnected`.
 */
export const noFetchInComponentRule: LitRule = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Disallow calling `fetch` inside a Lit component",
      url: docsUrl("no-fetch-in-component"),
    },
    schema: [],
    messages: {
      fetch:
        "Unexpected `fetch` call in a Lit component; move the request into a reactive controller that aborts it in `hostDisconnected`.",
    },
  },
  create(context) {
    return {
      CallExpression(node: TSESTree.CallExpression): void {
        const path = memberPath(node.callee);
        if (path === null || !FETCH_PATHS.has(path)) {
          return;
        }
        const owner = enclosingClass(node);
        if (owner === null || !isLitComponent(owner, context)) {
          return;
        }
        context.report({ node: node.callee, messageId: "fetch" });
      },
    };
  },
};
