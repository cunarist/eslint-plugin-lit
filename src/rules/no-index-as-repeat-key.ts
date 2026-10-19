import type { TSESTree } from "@typescript-eslint/types";

import { docsUrl, importedLocalName, isRepeatModule, type LitRule, memberPath } from "#helpers";

/** Function-like nodes usable as a key function. */
type KeyFunction = TSESTree.ArrowFunctionExpression | TSESTree.FunctionExpression;

/** The name of the second (index) parameter, when it is a plain identifier. */
function indexParamName(fn: KeyFunction): string | null {
  const param = fn.params[1];
  return param?.type === "Identifier" ? param.name : null;
}

/** The single expression a function returns, or null if it is not that shape. */
function returnedExpression(fn: KeyFunction): TSESTree.Expression | null {
  const body = fn.body;
  if (body.type !== "BlockStatement") {
    return body;
  }
  const [only] = body.body;
  if (body.body.length !== 1 || only?.type !== "ReturnStatement") {
    return null;
  }
  return only.argument;
}

/**
 * `no-index-as-repeat-key` - rejects a `repeat` key function that returns its
 * own index parameter, e.g. `repeat(items, (item, i) => i, template)`.
 *
 * Keying by index makes item 0 always key 0, so `repeat` reuses the DOM in
 * place and re-renders every row: the index-based reconciliation it exists to
 * avoid. `repeat(...)` is matched wherever it is called, not only inside a
 * template.
 */
export const noIndexAsRepeatKeyRule: LitRule = {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow `repeat` key functions that return the item index",
      url: docsUrl("no-index-as-repeat-key"),
    },
    schema: [],
    messages: {
      index:
        "Unexpected `repeat` key function returning the item index; key by something identifying the item, like `(item) => item.id`.",
    },
  },
  create(context) {
    /** Local names bound to `repeat` from the module we mean. */
    const locals = new Set<string>();

    return {
      ImportDeclaration(node: TSESTree.ImportDeclaration): void {
        const local = importedLocalName(node, isRepeatModule, "repeat");
        if (local !== null) {
          locals.add(local);
        }
      },

      CallExpression(node: TSESTree.CallExpression): void {
        const callee = memberPath(node.callee);
        if (callee === null || !locals.has(callee)) {
          return;
        }
        const keyFn = node.arguments[1];
        if (keyFn?.type !== "ArrowFunctionExpression" && keyFn?.type !== "FunctionExpression") {
          return;
        }
        const index = indexParamName(keyFn);
        const returned = returnedExpression(keyFn);
        if (index === null || returned?.type !== "Identifier" || returned.name !== index) {
          return;
        }
        context.report({ node: keyFn, messageId: "index" });
      },
    };
  },
};
