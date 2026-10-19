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

/**
 * `no-script-in-template` - rejects a `<script>` element inside a Lit
 * template.
 *
 * Templates are parsed as fragments and cloned into place, and the HTML spec
 * marks scripts created that way as already started, so the browser never runs
 * them. Nothing throws and nothing warns.
 */
export const noScriptInTemplateRule: LitRule = {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow `<script>` elements in templates",
      url: docsUrl("no-script-in-template"),
    },
    schema: [],
    messages: {
      script: "Unexpected `<script>` element in a template, where it never executes.",
    },
  },
  create(context) {
    return {
      TaggedTemplateExpression(node: TSESTree.TaggedTemplateExpression): void {
        if (!isHtmlTemplate(node, context)) {
          return;
        }
        const source = templateSource(node);
        if (!/<\s*script[\s/>]/iu.test(source.text)) {
          return;
        }
        walkElements(parseTemplate(source.text), (element) => {
          const location = element.sourceCodeLocation;
          if (element.tagName !== "script" || location === undefined || location === null) {
            return;
          }
          const span = location.startTag ?? location;
          context.report({
            loc: rangeLoc(
              context.sourceCode,
              source.toSourceRange(span.startOffset, span.endOffset),
            ),
            messageId: "script",
          });
        });
      },
    };
  },
};
