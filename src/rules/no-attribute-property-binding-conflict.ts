import type { TSESTree } from "@typescript-eslint/types";

import {
  docsUrl,
  isHtmlTemplate,
  type LitRule,
  type ParsedElement,
  parseTemplate,
  rangeLoc,
  templateSource,
  walkElements,
} from "#helpers";

/** Where an attribute's leading whitespace starts, so removing it leaves no gap. */
function leadingSpaceStart(text: string, offset: number): number {
  let start = offset;
  while (start > 0 && /\s/u.test(text.charAt(start - 1))) {
    start -= 1;
  }
  return start;
}

/**
 * `no-attribute-property-binding-conflict` — rejects the same name bound as
 * both an attribute and a property on one element.
 *
 * `<x-y foo=${a} .foo=${b}>` sets the attribute and the property from two
 * different sources. For a reactive property the attribute also feeds the
 * property, so the two race and whichever Lit commits last wins.
 */
export const noAttributePropertyBindingConflictRule: LitRule = {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow binding one name as both an attribute and a property on an element",
      url: docsUrl("no-attribute-property-binding-conflict"),
    },
    hasSuggestions: true,
    schema: [],
    messages: {
      conflict: "Unexpected `{{name}}` bound as both an attribute and a property.",
      remove: "Remove this binding and keep the other.",
    },
  },
  create(context) {
    return {
      TaggedTemplateExpression(node: TSESTree.TaggedTemplateExpression): void {
        if (!isHtmlTemplate(node, context)) {
          return;
        }
        const source = templateSource(node);
        walkElements(parseTemplate(source.text), (element: ParsedElement) => {
          const locations = element.sourceCodeLocation?.attrs;
          if (locations === undefined) {
            return;
          }
          for (const [key, location] of Object.entries(locations)) {
            const bare = key.slice(1);
            const other = key.startsWith(".") && bare.length > 0 ? locations[bare] : undefined;
            if (other === undefined) {
              continue;
            }
            // Report whichever binding comes second, as the duplicate.
            const later = location.startOffset > other.startOffset ? location : other;
            const laterName = later === location ? key : bare;
            const removal = source.toSourceRange(
              leadingSpaceStart(source.text, later.startOffset),
              later.endOffset,
            );
            context.report({
              loc: rangeLoc(
                context.sourceCode,
                source.toSourceRange(later.startOffset, later.startOffset + laterName.length),
              ),
              messageId: "conflict",
              data: { name: bare },
              suggest: [{ messageId: "remove", fix: (fixer) => fixer.removeRange(removal) }],
            });
          }
        });
      },
    };
  },
};
