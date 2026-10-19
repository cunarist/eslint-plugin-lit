import type { TSESTree } from "@typescript-eslint/types";

import {
  docsUrl,
  hasPlaceholder,
  isHtmlTemplate,
  type LitRule,
  type ParsedElement,
  parseTemplate,
  rangeLoc,
  templateSource,
  walkElements,
} from "#helpers";

/** Whether a slot is unambiguously the default slot. */
function isDefaultSlot(element: ParsedElement): boolean {
  const name = element.attrs.find((attribute) => attribute.name === "name");
  if (name === undefined) {
    return true;
  }
  // A bound name is unknowable; treat it as not provably default.
  return !hasPlaceholder(name.value) && name.value.length === 0;
}

/**
 * `no-multiple-default-slots` - rejects two or more unnamed `<slot>` elements
 * in one template.
 *
 * Unassigned light DOM children all go to the first default slot; the rest
 * never receive anything. A slot whose name is bound may or may not be a
 * default slot at runtime, so it is neither counted nor reported.
 */
export const noMultipleDefaultSlotsRule: LitRule = {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow more than one default `<slot>` in a template",
      url: docsUrl("no-multiple-default-slots"),
    },
    schema: [],
    messages: {
      extraDefault: "Unexpected second default `<slot>`, which never receives content.",
    },
  },
  create(context) {
    return {
      TaggedTemplateExpression(node: TSESTree.TaggedTemplateExpression): void {
        if (!isHtmlTemplate(node, context)) {
          return;
        }
        const source = templateSource(node);
        if (!/<\s*slot[\s/>]/iu.test(source.text)) {
          return;
        }
        let seenDefault = false;
        walkElements(parseTemplate(source.text), (element) => {
          if (element.tagName !== "slot" || !isDefaultSlot(element)) {
            return;
          }
          if (!seenDefault) {
            seenDefault = true;
            return;
          }
          const location = element.sourceCodeLocation;
          if (location === undefined || location === null) {
            return;
          }
          const span = location.startTag ?? location;
          context.report({
            loc: rangeLoc(
              context.sourceCode,
              source.toSourceRange(span.startOffset, span.endOffset),
            ),
            messageId: "extraDefault",
          });
        });
      },
    };
  },
};
