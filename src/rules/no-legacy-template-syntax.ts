import type { TSESTree } from "@typescript-eslint/types";

import {
  docsUrl,
  isHtmlTemplate,
  type LitRule,
  quasiOffsets,
  rangeLoc,
  templateSource,
} from "#helpers";

const LEGACY: RegExp = /\[\[[^\][]+\]\]|\{\{[^{}]+\}\}/gu;

/**
 * `no-legacy-template-syntax` - rejects Polymer-style `[[oneWay]]` and
 * `{{twoWay}}` bindings inside an `html` template.
 *
 * Lit only interpolates `${...}`; these render as literal text. The raw quasis
 * are scanned rather than the substituted text, since the binding placeholder
 * itself is spelled with double braces.
 */
export const noLegacyTemplateSyntaxRule: LitRule = {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow Polymer-style `[[...]]` and `{{...}}` bindings in templates",
      url: docsUrl("no-legacy-template-syntax"),
    },
    schema: [],
    messages: {
      legacy: "Unexpected Polymer binding `{{kind}}`, which Lit renders as plain text.",
    },
  },
  create(context) {
    return {
      TaggedTemplateExpression(node: TSESTree.TaggedTemplateExpression): void {
        if (!isHtmlTemplate(node, context)) {
          return;
        }
        const source = templateSource(node);
        const offsets = quasiOffsets(node);
        for (const [index, quasi] of node.quasi.quasis.entries()) {
          const offset = offsets[index] ?? 0;
          for (const match of quasi.value.raw.matchAll(LEGACY)) {
            const start = offset + match.index;
            context.report({
              loc: rangeLoc(
                context.sourceCode,
                source.toSourceRange(start, start + match[0].length),
              ),
              messageId: "legacy",
              data: { kind: match[0].startsWith("[[") ? "[[...]]" : "{{...}}" },
            });
          }
        }
      },
    };
  },
};
