import type { TSESTree } from "@typescript-eslint/types";
import { parseFragment } from "parse5";

import { docsUrl, isHtmlTemplate, type LitRule, rangeLoc, templateSource } from "#helpers";

/** Characters that terminate an attribute name. */
const NAME_END: RegExp = /[\s/>=]/u;

/** Characters that terminate an unquoted attribute value. */
const UNQUOTED_END: RegExp = /[\s>]/u;

/** Whitespace. */
const SPACE: RegExp = /\s/u;

/**
 * parse5 reports the duplicate at the offset just past the repeated attribute
 * name, the `=` or the whitespace that terminated it, so the name is read
 * backwards from there.
 */
function nameStart(text: string, offset: number): number {
  let start = offset;
  while (start > 0 && !NAME_END.test(text.charAt(start - 1))) {
    start -= 1;
  }
  return start;
}

/** The offset past the first character from `offset` that is not whitespace. */
function skipSpace(text: string, offset: number): number {
  let at = offset;
  while (at < text.length && SPACE.test(text.charAt(at))) {
    at += 1;
  }
  return at;
}

/** The offset just past an attribute whose name ends at `nameEnd`. */
function attributeEnd(text: string, nameEnd: number): number {
  const equals = skipSpace(text, nameEnd);
  if (text.charAt(equals) !== "=") {
    return nameEnd;
  }
  const valueStart = skipSpace(text, equals + 1);
  const quote = text.charAt(valueStart);
  if (quote === '"' || quote === "'") {
    const close = text.indexOf(quote, valueStart + 1);
    return close === -1 ? text.length : close + 1;
  }
  let end = valueStart;
  while (end < text.length && !UNQUOTED_END.test(text.charAt(end))) {
    end += 1;
  }
  return end;
}

/** Where an attribute's leading whitespace starts. */
function leadingSpaceStart(text: string, offset: number): number {
  let start = offset;
  while (start > 0 && SPACE.test(text.charAt(start - 1))) {
    start -= 1;
  }
  return start;
}

/** The kind of binding a name's sigil makes, for the message. */
function kindOf(name: string): string {
  switch (name.charAt(0)) {
    case ".":
      return "property";
    case "?":
      return "boolean attribute";
    case "@":
      return "event listener";
    default:
      return "attribute";
  }
}

/**
 * `no-duplicate-template-bindings` — rejects the same attribute, property,
 * boolean, or event binding appearing twice on one element.
 *
 * The four sigils are separate namespaces (`foo`, `.foo`, `?foo`, and `@foo`
 * may coexist) but a repeat within one is silently dropped by the parser.
 * parse5 already reports this as a `duplicate-attribute` parse error, and the
 * sigil is part of the attribute name, so the namespacing falls out for free.
 */
export const noDuplicateTemplateBindingsRule: LitRule = {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow binding the same attribute, property, or event twice on one element",
      url: docsUrl("no-duplicate-template-bindings"),
    },
    hasSuggestions: true,
    schema: [],
    messages: {
      duplicate: "Unexpected duplicate {{kind}} `{{name}}`; only the first binding takes effect.",
      remove: "Remove the duplicate binding.",
    },
  },
  create(context) {
    return {
      TaggedTemplateExpression(node: TSESTree.TaggedTemplateExpression): void {
        if (!isHtmlTemplate(node, context)) {
          return;
        }
        const source = templateSource(node);
        const { text } = source;
        parseFragment(text, {
          sourceCodeLocationInfo: true,
          onParseError: (error) => {
            if (error.code !== "duplicate-attribute") {
              return;
            }
            const end = error.startOffset;
            const start = nameStart(text, end);
            const name = text.slice(start, end);
            if (name.length === 0) {
              return;
            }
            const removal = source.toSourceRange(
              leadingSpaceStart(text, start),
              attributeEnd(text, end),
            );
            context.report({
              loc: rangeLoc(context.sourceCode, source.toSourceRange(start, end)),
              messageId: "duplicate",
              data: { kind: kindOf(name), name },
              suggest: [{ messageId: "remove", fix: (fixer) => fixer.removeRange(removal) }],
            });
          },
        });
      },
    };
  },
};
