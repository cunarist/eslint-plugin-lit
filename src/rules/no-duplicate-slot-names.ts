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

/** Whether a template's markup contains a `<slot>` at all. */
const SLOT_TAG: RegExp = /<\s*slot[\s/>]/iu;

/** The literal `name` attribute of a slot, or null when absent or bound. */
function slotName(element: ParsedElement): string | null {
  const attribute = element.attrs.find((attr) => attr.name === "name");
  if (attribute === undefined || hasPlaceholder(attribute.value)) {
    return null;
  }
  return attribute.value;
}

/**
 * `no-duplicate-slot-names` - rejects two `<slot>` elements with the same
 * `name` in one template.
 *
 * Slot assignment matches light-DOM children against the first slot of a given
 * name; every later slot with that name stays permanently empty. A bound name
 * (`<slot name=${this.slot}>`) is unknowable statically and is skipped.
 */
export const noDuplicateSlotNamesRule: LitRule = {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow two slots with the same name in one template",
      url: docsUrl("no-duplicate-slot-names"),
    },
    schema: [],
    messages: {
      duplicate:
        "Unexpected duplicate slot name `{{name}}`; only the first slot with a given name receives content.",
    },
  },
  create(context) {
    return {
      TaggedTemplateExpression(node: TSESTree.TaggedTemplateExpression): void {
        if (!isHtmlTemplate(node, context)) {
          return;
        }
        const source = templateSource(node);
        if (!SLOT_TAG.test(source.text)) {
          return;
        }
        const seen = new Set<string>();
        // `walkElements` visits in document order, so the first slot is kept.
        walkElements(parseTemplate(source.text), (element: ParsedElement) => {
          if (element.tagName !== "slot") {
            return;
          }
          const name = slotName(element);
          if (name === null || name.length === 0) {
            return;
          }
          if (!seen.has(name)) {
            seen.add(name);
            return;
          }
          const location = element.sourceCodeLocation;
          if (location === undefined || location === null) {
            return;
          }
          const span = location.attrs?.["name"] ?? location.startTag ?? location;
          context.report({
            loc: rangeLoc(
              context.sourceCode,
              source.toSourceRange(span.startOffset, span.endOffset),
            ),
            messageId: "duplicate",
            data: { name },
          });
        });
      },
    };
  },
};
