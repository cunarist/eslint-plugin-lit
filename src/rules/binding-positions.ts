import type { TSESTree } from "@typescript-eslint/types";

import {
  bindingPlaceholder,
  docsUrl,
  isHtmlTemplate,
  type LitRule,
  rangeLoc,
  templateSource,
} from "#helpers";

/** Where a binding cannot go, and how the message names that place. */
interface Position {
  pattern: RegExp;
  what: string;
}

/** Checked in this order; the first match is the one reported. */
const POSITIONS: readonly Position[] = [
  { pattern: /<\/\s*\{\{__lit_(\d+)__\}\}/u, what: "a closing tag" },
  { pattern: /<\s*\{\{__lit_(\d+)__\}\}/u, what: "a tag name" },
  { pattern: /<[a-zA-Z][^>]*?\s\{\{__lit_(\d+)__\}\}\s*=/u, what: "an attribute name" },
];

/**
 * `binding-positions` — rejects a `${…}` binding used as a tag name, in a
 * closing tag, or as an attribute name.
 *
 * Lit can only bind attribute values, properties, events, and child content.
 * At most one diagnostic is reported per template.
 */
export const bindingPositionsRule: LitRule = {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow bindings in tag names, closing tags, and attribute names",
      url: docsUrl("binding-positions"),
    },
    schema: [],
    messages: {
      position:
        "Unexpected binding in {{what}}; Lit can only bind attribute values, properties, events, and child content.",
    },
  },
  create(context) {
    return {
      TaggedTemplateExpression(node: TSESTree.TaggedTemplateExpression): void {
        if (!isHtmlTemplate(node, context)) {
          return;
        }
        const source = templateSource(node);
        for (const { pattern, what } of POSITIONS) {
          const match = pattern.exec(source.text);
          if (match === null) {
            continue;
          }
          const placeholder = bindingPlaceholder(Number(match[1]));
          const start = source.text.indexOf(placeholder, match.index);
          if (start === -1) {
            continue;
          }
          context.report({
            loc: rangeLoc(
              context.sourceCode,
              source.toSourceRange(start, start + placeholder.length),
            ),
            messageId: "position",
            data: { what },
          });
          return;
        }
      },
    };
  },
};
