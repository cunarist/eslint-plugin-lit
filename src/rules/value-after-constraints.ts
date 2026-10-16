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

/** Elements with constraint validation. */
const FORM_CONTROLS: ReadonlySet<string> = new Set(["input", "select", "textarea"]);

/** Attributes that constrain what counts as a valid value. */
const CONSTRAINTS: readonly string[] = [
  "min",
  "max",
  "step",
  "pattern",
  "maxlength",
  "minlength",
  "required",
];

/** The two spellings of a value binding. */
const VALUE_NAMES: readonly string[] = ["value", ".value"];

/**
 * `value-after-constraints` — rejects a `value` binding that comes before a
 * validity constraint attribute on the same form control.
 *
 * Lit applies bindings in source order, so a value set before its constraints
 * is validated against none, and the control can report the wrong validity.
 * Each element is reported once, for its first offending pair.
 */
export const valueAfterConstraintsRule: LitRule = {
  meta: {
    type: "problem",
    docs: {
      description: "Enforce setting `value` after every validity constraint attribute",
      url: docsUrl("value-after-constraints"),
    },
    schema: [],
    messages: {
      early:
        "`{{value}}` is set before the `{{constraint}}` constraint, so validation does not see it; move the value after every constraint attribute.",
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
          if (!FORM_CONTROLS.has(element.tagName.toLowerCase()) || locations === undefined) {
            return;
          }
          for (const valueName of VALUE_NAMES) {
            const value = locations[valueName];
            if (value === undefined) {
              continue;
            }
            for (const constraint of CONSTRAINTS) {
              const other =
                locations[constraint] ?? locations[`?${constraint}`] ?? locations[`.${constraint}`];
              if (other === undefined || other.startOffset < value.startOffset) {
                continue;
              }
              context.report({
                loc: rangeLoc(
                  context.sourceCode,
                  source.toSourceRange(value.startOffset, value.endOffset),
                ),
                messageId: "early",
                data: { value: valueName, constraint },
              });
              return;
            }
          }
        });
      },
    };
  },
};
