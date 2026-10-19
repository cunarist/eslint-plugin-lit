import type { TSESTree } from "@typescript-eslint/types";

import {
  docsUrl,
  isHtmlTemplate,
  type LitRule,
  type LitRuleContext,
  type ParsedElement,
  parseTemplate,
  rangeLoc,
  type SourceRange,
  type TemplateSource,
  templateSource,
  walkElements,
} from "#helpers";

/** A bare `&` that does not start a character reference, or `<`, `>`, `"`. */
const OFFENDERS: RegExp = /[<>"]|&(?!(?:#\d+|#[xX][\da-fA-F]+|[a-zA-Z][a-zA-Z\d]*);)/gu;

/** The entity each offending character is written as. */
const REPLACEMENTS: ReadonlyMap<string, string> = new Map([
  ["&", "&amp;"],
  ["<", "&lt;"],
  [">", "&gt;"],
  ['"', "&quot;"],
]);

/**
 * An `&` followed by a letter, digit, or `#` may already decode as a character
 * reference without its `;` (`&copy x`, `&#38`), so escaping it could change
 * the value. Those get a suggestion; every other offender is fixed.
 */
const MAYBE_REFERENCE: RegExp = /^&[a-zA-Z\d#]/u;

/** Matches every binding placeholder. */
const PLACEHOLDERS: RegExp = /\{\{__lit_\d+__\}\}/gu;

/** Blank out binding placeholders, preserving offsets. */
function maskPlaceholders(text: string): string {
  return text.replaceAll(PLACEHOLDERS, (match) => " ".repeat(match.length));
}

/** Where an attribute's raw value sits in the template text. */
interface AttributeValue {
  /** Offset of the first character of the value in the template text. */
  start: number;
  /** Offset just past the last character of the value. */
  end: number;
}

/**
 * Locate the raw value of an attribute inside its `name="value"` span. Returns
 * null for a valueless attribute.
 */
function attributeValue(text: string, start: number, end: number): AttributeValue | null {
  const raw = text.slice(start, end);
  const equals = raw.indexOf("=");
  if (equals === -1) {
    return null;
  }
  let valueStart = equals + 1;
  while (valueStart < raw.length && /\s/u.test(raw.charAt(valueStart))) {
    valueStart += 1;
  }
  let valueEnd = raw.length;
  const quote = raw.charAt(valueStart);
  if ((quote === '"' || quote === "'") && raw.endsWith(quote)) {
    valueStart += 1;
    valueEnd -= 1;
  }
  if (valueEnd <= valueStart) {
    return null;
  }
  return { start: start + valueStart, end: start + valueEnd };
}

/** One offending character in an attribute value. */
interface Offender {
  range: SourceRange;
  character: string;
  /** The value text from the character on, to tell a possible reference. */
  rest: string;
}

/** Reports an offender: fixed outright, or suggested when it may be a reference. */
function report(context: LitRuleContext, { range, character, rest }: Offender): void {
  const entity = REPLACEMENTS.get(character) ?? character;
  const loc = rangeLoc(context.sourceCode, range);
  const data = { character, entity };
  if (MAYBE_REFERENCE.test(rest)) {
    context.report({
      loc,
      messageId: "unescaped",
      data,
      suggest: [
        {
          messageId: "escape",
          data,
          fix: (fixer) => fixer.replaceTextRange(range, entity),
        },
      ],
    });
    return;
  }
  context.report({
    loc,
    messageId: "unescaped",
    data,
    fix: (fixer) => fixer.replaceTextRange(range, entity),
  });
}

/** Reports every offender in the static attribute values of one element. */
function checkElement(
  context: LitRuleContext,
  source: TemplateSource,
  element: ParsedElement,
): void {
  const locations = element.sourceCodeLocation?.attrs;
  if (locations === undefined) {
    return;
  }
  for (const location of Object.values(locations)) {
    const value = attributeValue(source.text, location.startOffset, location.endOffset);
    if (value === null) {
      continue;
    }
    const raw = maskPlaceholders(source.text.slice(value.start, value.end));
    for (const match of raw.matchAll(OFFENDERS)) {
      const character = match[0];
      const at = value.start + match.index;
      report(context, {
        range: source.toSourceRange(at, at + character.length),
        character,
        rest: raw.slice(match.index),
      });
    }
  }
}

/**
 * `attribute-value-entities` - rejects an unescaped `&`, `<`, `>`, or `"`
 * inside a static attribute value in an `html` template.
 *
 * Characters that are significant to the HTML parser must be written as
 * entities inside attribute values. Bindings are excluded: a `${...}` is
 * substituted for a placeholder before parsing, so expression text is never
 * scanned.
 */
export const attributeValueEntitiesRule: LitRule = {
  meta: {
    type: "problem",
    docs: {
      description: 'Require HTML entities for `&`, `<`, `>`, and `"` in template attribute values',
      url: docsUrl("attribute-value-entities"),
    },
    fixable: "code",
    hasSuggestions: true,
    schema: [],
    messages: {
      unescaped: "Unexpected unescaped `{{character}}` in an attribute value.",
      escape: "Write it as `{{entity}}`.",
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
          checkElement(context, source, element);
        });
      },
    };
  },
};
