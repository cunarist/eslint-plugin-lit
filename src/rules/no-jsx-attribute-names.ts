import type { TSESTree } from "@typescript-eslint/types";

import {
  docsUrl,
  isHtmlTemplate,
  type LitRule,
  parseTemplate,
  rangeLoc,
  templateSource,
  walkElements,
} from "#helpers";

/** JSX attribute name, as parse5 lowercases it, to its HTML equivalent. */
const JSX_NAMES: ReadonlyMap<string, string> = new Map([
  ["classname", "class"],
  ["htmlfor", "for"],
]);

/**
 * `no-jsx-attribute-names` - rejects the JSX attribute names `className` and
 * `htmlFor` in a template.
 *
 * Template markup is real HTML, so these set attributes of those literal names
 * and have no effect. Only the plain attribute form is flagged: `.className`
 * and `.htmlFor` are property bindings to real DOM properties.
 */
export const noJsxAttributeNamesRule: LitRule = {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow the JSX attribute names `className` and `htmlFor` in templates",
      url: docsUrl("no-jsx-attribute-names"),
    },
    hasSuggestions: true,
    schema: [],
    messages: {
      jsxName: "Unexpected JSX attribute name `{{name}}`; the HTML name is `{{replacement}}`.",
      rename: "Rename the attribute to `{{replacement}}`.",
    },
  },
  create(context) {
    return {
      TaggedTemplateExpression(node: TSESTree.TaggedTemplateExpression): void {
        if (!isHtmlTemplate(node, context)) {
          return;
        }
        const source = templateSource(node);
        walkElements(parseTemplate(source.text), (element) => {
          const locations = element.sourceCodeLocation?.attrs;
          if (locations === undefined) {
            return;
          }
          for (const [key, location] of Object.entries(locations)) {
            const replacement = JSX_NAMES.get(key);
            if (replacement === undefined) {
              continue;
            }
            const raw = source.text.slice(location.startOffset, location.endOffset);
            const equals = raw.indexOf("=");
            const name = equals === -1 ? raw : raw.slice(0, equals);
            const range = source.toSourceRange(
              location.startOffset,
              location.startOffset + name.length,
            );
            context.report({
              loc: rangeLoc(context.sourceCode, range),
              messageId: "jsxName",
              data: { name, replacement },
              suggest: [
                {
                  messageId: "rename",
                  data: { replacement },
                  fix: (fixer) => fixer.replaceTextRange(range, replacement),
                },
              ],
            });
          }
        });
      },
    };
  },
};
