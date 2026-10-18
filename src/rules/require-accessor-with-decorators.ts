import type { TSESTree } from "@typescript-eslint/types";

import {
  docsUrl,
  enclosingClass,
  isLitComponent,
  isReactiveProperty,
  keyName,
  type LitRule,
} from "#helpers";

/**
 * `require-accessor-with-decorators` — reports a `@property` or `@state`
 * decorator on a plain class field instead of an `accessor` field.
 *
 * Under standard (TC39) decorators these decorators can only install a
 * reactive accessor on a field declared with `accessor`; on a plain field
 * writes never request an update. A lint rule cannot read `tsconfig`, so it
 * cannot tell whether the project uses standard decorators.
 */
export const requireAccessorWithDecoratorsRule: LitRule = {
  meta: {
    type: "problem",
    docs: {
      description: "Require `accessor` on fields decorated with `@property` or `@state`",
      url: docsUrl("require-accessor-with-decorators"),
    },
    hasSuggestions: true,
    schema: [],
    messages: {
      plainField: "Reactive property `{{name}}` is a plain field, not an accessor.",
      addAccessor: "Declare `{{name}}` with `accessor`.",
    },
  },
  create(context) {
    return {
      PropertyDefinition(node: TSESTree.PropertyDefinition): void {
        if (node.static || !isReactiveProperty(node)) {
          return;
        }
        const owner = enclosingClass(node);
        if (owner === null || !isLitComponent(owner, context)) {
          return;
        }
        const name = keyName(node.key) ?? "the field";
        // `accessor` combines with neither `readonly` nor `declare`, and a
        // computed key's `[` comes before the key node.
        const fixable = !node.readonly && !node.declare && !node.computed;
        const keyStart = node.key.range[0];
        context.report({
          node: node.key,
          messageId: "plainField",
          data: { name },
          suggest: fixable
            ? [
                {
                  messageId: "addAccessor",
                  data: { name },
                  fix: (fixer) => fixer.insertTextBeforeRange([keyStart, keyStart], "accessor "),
                },
              ]
            : [],
        });
      },
    };
  },
};
