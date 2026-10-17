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

/** Elements whose `value` is live control state rather than plain markup. */
const FORM_CONTROLS: ReadonlySet<string> = new Set([
  "button",
  "data",
  "input",
  "li",
  "meter",
  "option",
  "output",
  "param",
  "progress",
  "select",
  "textarea",
]);

/**
 * An attribute written exactly `value=` around one binding, quoted or not:
 * the one shape that turns into a property binding by adding a dot.
 */
const WHOLE_BINDING: RegExp = /^value=(["']?)\{\{__lit_\d+__\}\}\1$/u;

/**
 * `no-value-attribute` — rejects a bound `value=${…}` attribute on a form
 * control.
 *
 * The attribute is only the control's default value: once the user has typed,
 * it no longer drives what is displayed. The property binding `.value=${…}`
 * does. A static `value="5"` is a legitimate default and is not reported.
 */
export const noValueAttributeRule: LitRule = {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow a bound `value` attribute on a form control",
      url: docsUrl("no-value-attribute"),
    },
    hasSuggestions: true,
    schema: [],
    messages: {
      attribute:
        "Bound `value` attribute on `<{{tag}}>` sets only the default value, not what the control shows.",
      useProperty: "Bind the `.value` property instead.",
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
          const tag = element.tagName.toLowerCase();
          const location = element.sourceCodeLocation?.attrs?.["value"];
          if (!FORM_CONTROLS.has(tag) || location === undefined) {
            return;
          }
          const raw = source.text.slice(location.startOffset, location.endOffset);
          if (!hasPlaceholder(raw)) {
            return;
          }
          const start = source.toSourceOffset(location.startOffset);
          context.report({
            loc: rangeLoc(
              context.sourceCode,
              source.toSourceRange(location.startOffset, location.endOffset),
            ),
            messageId: "attribute",
            data: { tag },
            suggest: WHOLE_BINDING.test(raw)
              ? [
                  {
                    messageId: "useProperty",
                    fix: (fixer) => fixer.insertTextBeforeRange([start, start], "."),
                  },
                ]
              : [],
          });
        });
      },
    };
  },
};
