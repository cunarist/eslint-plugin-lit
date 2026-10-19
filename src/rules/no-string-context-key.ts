import type { RuleTextEdit, RuleTextEditor } from "@eslint/core";
import type { TSESTree } from "@typescript-eslint/types";

import { docsUrl, importedLocalName, isContextModule, type LitRule, memberPath } from "#helpers";

/**
 * `no-string-context-key` - `createContext("theme")` keys the context by that
 * string. Context lookup compares keys with `===`, and strings compare by
 * value, so any other package that picks `"theme"` silently answers your
 * consumer's request. A `Symbol` is unique by construction.
 */
export const noStringContextKeyRule: LitRule = {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow a string literal as a `createContext()` key",
      url: docsUrl("no-string-context-key"),
    },
    hasSuggestions: true,
    schema: [],
    messages: {
      stringKey: 'Unexpected string context key "{{key}}".',
      useSymbol: "Wrap the key in `Symbol()`, so no other context can share it.",
    },
  },
  create(context) {
    /**
     * Local names bound to `createContext` from `@lit/context`. The binding is
     * required: without it the rule reports any function called
     * `createContext`, React's included.
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
        if (path === null || !locals.has(path)) {
          return;
        }
        const key = node.arguments[0];
        if (key?.type !== "Literal" || typeof key.value !== "string") {
          return;
        }
        context.report({
          node: key,
          messageId: "stringKey",
          data: { key: key.value },
          suggest: [
            {
              messageId: "useSymbol",
              fix: (fixer: RuleTextEditor): RuleTextEdit =>
                fixer.replaceText(key, `Symbol(${key.raw})`),
            },
          ],
        });
      },
    };
  },
};
