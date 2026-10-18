import type { TSESTree } from "@typescript-eslint/types";

import {
  docsUrl,
  enclosingClass,
  isLitComponent,
  type LitRule,
  type LitRuleContext,
  memberPath,
} from "#helpers";

/** Constructors that hand back something needing an explicit release. */
const DISPOSABLE_CONSTRUCTORS: ReadonlySet<string> = new Set([
  "AbortController",
  "EventSource",
  "IntersectionObserver",
  "MutationObserver",
  "ResizeObserver",
  "WebSocket",
  "Worker",
]);

/**
 * DOM methods that register or release a listener.
 *
 * Only real DOM API names belong here. `destroy`, `dispose` and `disconnect`
 * are names people give their own methods, so matching them would report
 * `chart.destroy()` or `db.dispose()`, which are not component-owned
 * resources.
 */
const DISPOSABLE_METHODS: ReadonlySet<string> = new Set([
  "addEventListener",
  "removeEventListener",
]);

/** Whether the node sits inside a Lit component class body. */
function inLitComponent(node: TSESTree.Node, context: LitRuleContext): boolean {
  const owner = enclosingClass(node);
  return owner !== null && isLitComponent(owner, context);
}

/** Last segment of a dotted path, e.g. `globalThis.Worker` -> `Worker`. */
function lastSegment(path: string | null): string | null {
  return path === null ? null : (path.split(".").at(-1) ?? path);
}

/**
 * `no-component-disposables` — a component renders; it does not own
 * resources.
 *
 * Anything with a lifetime, an observer, a socket, a worker, a listener, must
 * live in a `ReactiveController` that releases it in `hostDisconnected`, so
 * acquisition and release sit in one file.
 */
export const noComponentDisposablesRule: LitRule = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Disallow creating disposable resources and listeners inside a Lit component",
      url: docsUrl("no-component-disposables"),
    },
    schema: [],
    messages: {
      construct:
        "Unexpected `{{name}}` constructed in a Lit component; delegate it to a reactive controller.",
      call: "Unexpected `{{name}}` call in a Lit component; delegate it to a reactive controller.",
    },
  },
  create(context) {
    return {
      NewExpression(node: TSESTree.NewExpression): void {
        const name = lastSegment(memberPath(node.callee));
        if (name === null || !DISPOSABLE_CONSTRUCTORS.has(name)) {
          return;
        }
        if (!inLitComponent(node, context)) {
          return;
        }
        context.report({ node: node.callee, messageId: "construct", data: { name } });
      },
      CallExpression(node: TSESTree.CallExpression): void {
        const { callee } = node;
        if (
          callee.type !== "MemberExpression" ||
          callee.computed ||
          callee.property.type !== "Identifier"
        ) {
          return;
        }
        const { name } = callee.property;
        if (!DISPOSABLE_METHODS.has(name) || !inLitComponent(node, context)) {
          return;
        }
        context.report({ node: callee, messageId: "call", data: { name } });
      },
    };
  },
};
