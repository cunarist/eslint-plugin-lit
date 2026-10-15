import type { TSESTree } from "@typescript-eslint/types";

import type { LitRule } from "#helpers";
import { docsUrl, importedLocalName, isContextModule, memberPath } from "#helpers";

/**
 * `require-context-type` — requires `createContext()` from `@lit/context` to
 * be given an explicit type argument.
 *
 * Without one the context is `Context<unknown, unknown>`, so every `@consume`
 * field widens to `unknown` and no provider and consumer mismatch is caught.
 */
export const requireContextTypeRule: LitRule = {
  meta: {
    type: "problem",
    docs: {
      description: "Require an explicit type argument on `createContext()`",
      url: docsUrl("require-context-type"),
    },
    schema: [],
    messages: {
      untyped:
        "`createContext()` has no type argument, so its consumers receive `unknown`; write `createContext<Type>(…)`.",
    },
  },
  create(context) {
    /**
     * Local names bound to `createContext` from `@lit/context`. Without the
     * import the rule would report any function called `createContext`.
     */
    const locals = new Set<string>();
    return {
      ImportDeclaration(node: TSESTree.ImportDeclaration): void {
        const local = importedLocalName(node, isContextModule, "createContext");
        if (local !== null) {
          locals.add(local);
        }
      },
      CallExpression(node: TSESTree.CallExpression): void {
        const path = memberPath(node.callee);
        // Oxlint gives a call without `<…>` `null` type arguments, ESLint none.
        const typed = (node.typeArguments ?? null) !== null;
        if (path === null || !locals.has(path) || typed) {
          return;
        }
        context.report({ node: node.callee, messageId: "untyped" });
      },
    };
  },
};
