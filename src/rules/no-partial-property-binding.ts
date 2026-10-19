import type { TSESTree } from "@typescript-eslint/types";

import {
  bindingPlaceholder,
  docsUrl,
  isHtmlTemplate,
  type LitRule,
  type ParsedElement,
  parseTemplate,
  placeholderIndices,
  rangeLoc,
  templateSource,
  walkElements,
} from "#helpers";

/** Each sigil whose binding must stand alone, and what it binds. */
const SIGILS: ReadonlyMap<string, string> = new Map([
  [".", "property"],
  ["@", "event"],
  ["?", "boolean"],
]);

/** An attribute as written, with its original casing and quoting. */
interface RawAttribute {
  name: string;
  value: string;
  hasValue: boolean;
  start: number;
  end: number;
}

/** Strip one pair of matching quotes from an attribute value. */
function unquote(value: string): string {
  const quote = value[0];
  if (value.length >= 2 && (quote === '"' || quote === "'") && value.endsWith(quote)) {
    return value.slice(1, -1);
  }
  return value;
}

/**
 * Attributes with their original casing and quoting, in source order.
 *
 * parse5 lowercases attribute names and unescapes values, so neither `attrs`
 * nor the location keys can be used directly; the raw text is sliced back out
 * of the template instead.
 */
function rawAttributes(element: ParsedElement, text: string): RawAttribute[] {
  const locations = element.sourceCodeLocation?.attrs;
  if (locations === undefined) {
    return [];
  }
  const attributes: RawAttribute[] = [];
  for (const location of Object.values(locations)) {
    const raw = text.slice(location.startOffset, location.endOffset);
    const equals = raw.indexOf("=");
    attributes.push({
      name: equals === -1 ? raw : raw.slice(0, equals),
      value: equals === -1 ? "" : unquote(raw.slice(equals + 1).trim()),
      hasValue: equals !== -1,
      start: location.startOffset,
      end: location.endOffset,
    });
  }
  return attributes.toSorted((left, right) => left.start - right.start);
}

/** Whether a string is exactly one binding placeholder. */
function isSinglePlaceholder(text: string): boolean {
  const indices = placeholderIndices(text);
  const [only] = indices;
  return indices.length === 1 && only !== undefined && text === bindingPlaceholder(only);
}

/**
 * `no-partial-property-binding` — rejects a property, event or boolean binding
 * that is not the entire attribute value.
 *
 * Lit cannot compose a value out of parts for these, so it throws at render
 * time. Only plain attributes may interleave literal text with bindings.
 */
export const noPartialPropertyBindingRule: LitRule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow property, event, and boolean bindings that are not the whole attribute value",
      url: docsUrl("no-partial-property-binding"),
    },
    schema: [],
    messages: {
      partial: "Unexpected partial {{kind}} binding; it must be the whole attribute value.",
    },
  },
  create(context) {
    return {
      TaggedTemplateExpression(node: TSESTree.TaggedTemplateExpression): void {
        if (!isHtmlTemplate(node, context)) {
          return;
        }
        const source = templateSource(node);

        function report(kind: string, start: number, end: number): void {
          context.report({
            loc: rangeLoc(context.sourceCode, source.toSourceRange(start, end)),
            messageId: "partial",
            data: { kind },
          });
        }

        walkElements(parseTemplate(source.text), (element) => {
          const attributes = rawAttributes(element, source.text);
          for (const [index, attribute] of attributes.entries()) {
            const kind = SIGILS.get(attribute.name.charAt(0));
            if (kind !== undefined) {
              // A static `.prop="hello"` is a legitimate literal assignment.
              if (
                attribute.hasValue &&
                !isSinglePlaceholder(attribute.value) &&
                placeholderIndices(attribute.value).length > 0
              ) {
                report(kind, attribute.start, attribute.end);
              }
              continue;
            }
            // `.prop=${a} ${b}`: the unquoted value stops at the space, so the
            // trailing binding lands here as a valueless attribute of its own.
            if (attribute.hasValue || !isSinglePlaceholder(attribute.name)) {
              continue;
            }
            const previous = attributes[index - 1];
            const previousKind =
              previous === undefined ? undefined : SIGILS.get(previous.name.charAt(0));
            if (previous !== undefined && previousKind !== undefined) {
              report(previousKind, previous.start, attribute.end);
            }
          }
        });
      },
    };
  },
};
