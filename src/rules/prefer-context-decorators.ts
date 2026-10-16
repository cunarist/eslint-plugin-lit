import type { TSESTree } from "@typescript-eslint/types";

import { docsUrl, enclosingClass, isLitComponent, type LitRule, memberPath } from "#helpers";

/** The imperative context classes this rule steers away from, with their decorator. */
const IMPERATIVE_CLASSES: ReadonlyMap<string, string> = new Map([
  ["ContextProvider", "@provide"],
  ["ContextConsumer", "@consume"],
]);

/** Last segment of a dotted path, so `context.ContextProvider` still matches. */
function lastSegment(path: string): string {
  return path.split(".").pop() ?? path;
}

/**
 * `prefer-context-decorators` — use the `@provide` and `@consume` decorators
 * rather than constructing a `ContextProvider` or `ContextConsumer` by hand
 * inside a Lit component.
 */
export const preferContextDecoratorsRule: LitRule = {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Enforce `@provide` and `@consume` over constructing `ContextProvider` or `ContextConsumer`",
      url: docsUrl("prefer-context-decorators"),
    },
    schema: [],
    messages: {
      byHand: "Unexpected `{{name}}` constructed by hand instead of the `{{decorator}}` decorator.",
    },
  },
  create(context) {
    /** Local names bound to an imperative context class by an import. */
    const localNames = new Map<string, string>();

    return {
      ImportDeclaration(node: TSESTree.ImportDeclaration): void {
        if (node.source.value !== "@lit/context") {
          return;
        }
        for (const specifier of node.specifiers) {
          if (specifier.type !== "ImportSpecifier") {
            continue;
          }
          const imported = specifier.imported;
          const name = imported.type === "Identifier" ? imported.name : imported.value;
          const decorator = IMPERATIVE_CLASSES.get(name);
          if (decorator !== undefined) {
            localNames.set(specifier.local.name, decorator);
          }
        }
      },
      NewExpression(node: TSESTree.NewExpression): void {
        const path = memberPath(node.callee);
        if (path === null) {
          return;
        }
        const name = lastSegment(path);
        const decorator = localNames.get(path) ?? IMPERATIVE_CLASSES.get(name);
        if (decorator === undefined) {
          return;
        }
        // Only steer components; a non-Lit class has no decorator to use.
        const owner = enclosingClass(node);
        if (owner === null || !isLitComponent(owner, context)) {
          return;
        }
        context.report({ node, messageId: "byHand", data: { name, decorator } });
      },
    };
  },
};
