import type { TSESTree } from "@typescript-eslint/types";

import type { LitRule, ParsedElement } from "#helpers";
import {
  docsUrl,
  isHtmlTemplate,
  parseTemplate,
  rangeLoc,
  templateSource,
  walkElements,
} from "#helpers";

/** A quick test for a `<style>` start tag, before parsing the template. */
const STYLE_TAG: RegExp = /<\s*style[\s>]/iu;

/**
 * `prefer-static-styles` — rejects a `<style>` element inside an `html`
 * template.
 *
 * It is re-parsed on every render and cannot be shared between instances;
 * `static styles` with a `` css`…` `` literal is parsed once and shared.
 */
export const preferStaticStylesRule: LitRule = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Enforce `static styles` over `<style>` elements in templates",
      url: docsUrl("prefer-static-styles"),
    },
    schema: [],
    messages: {
      style:
        "Unexpected `<style>` element in a template; move the rules into `static styles` so they are parsed once and shared.",
    },
  },
  create(context) {
    return {
      TaggedTemplateExpression(node: TSESTree.TaggedTemplateExpression): void {
        if (!isHtmlTemplate(node, context)) {
          return;
        }
        const source = templateSource(node);
        if (!STYLE_TAG.test(source.text)) {
          return;
        }
        walkElements(parseTemplate(source.text), (element: ParsedElement) => {
          const location = element.sourceCodeLocation;
          if (element.tagName !== "style" || location === null || location === undefined) {
            return;
          }
          const tag = location.startTag ?? location;
          context.report({
            loc: rangeLoc(context.sourceCode, source.toSourceRange(tag.startOffset, tag.endOffset)),
            messageId: "style",
          });
        });
      },
    };
  },
};
