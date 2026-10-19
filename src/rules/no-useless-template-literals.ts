import type { TSESTree } from "@typescript-eslint/types";

import { docsUrl, isHtmlTemplate, isSimpleReference, type LitRule } from "#helpers";

/**
 * `no-useless-template-literals` - rejects an `html` template whose entire
 * content is one binding and no markup (`` html`${x}` ``), which produces no
 * markup of its own.
 */
export const noUselessTemplateLiteralsRule: LitRule = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Disallow an `html` template that holds only a single binding",
      url: docsUrl("no-useless-template-literals"),
    },
    hasSuggestions: true,
    schema: [],
    messages: {
      lone: "Unexpected template that contains only a single binding and adds no markup.",
      useValue: "Use the interpolated value directly.",
    },
  },
  create(context) {
    return {
      TaggedTemplateExpression(node: TSESTree.TaggedTemplateExpression): void {
        if (!isHtmlTemplate(node, context)) {
          return;
        }
        const { quasis, expressions } = node.quasi;
        const [before, after] = quasis;
        const [value] = expressions;
        if (quasis.length !== 2 || expressions.length !== 1 || value === undefined) {
          return;
        }
        if (before?.value.raw !== "" || after?.value.raw !== "") {
          return;
        }
        const raw = context.sourceCode.text.slice(value.range[0], value.range[1]);
        // A name, member chain, or call binds as tightly as the tagged
        // template it replaces; anything else keeps its own parentheses.
        const bare = isSimpleReference(value) || value.type === "CallExpression";
        const text = bare ? raw : `(${raw})`;
        context.report({
          node,
          messageId: "lone",
          suggest: [
            {
              messageId: "useValue",
              fix: (fixer) => fixer.replaceTextRange(node.range, text),
            },
          ],
        });
      },
    };
  },
};
