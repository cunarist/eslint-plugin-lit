import type { TSESTree } from "@typescript-eslint/types";
import { parseFragment, type ParserError } from "parse5";

import {
  docsUrl,
  isHtmlTemplate,
  type LitRule,
  type LitRuleContext,
  type ParsedElement,
  rangeLoc,
  type TemplateSource,
  templateSource,
  walkElements,
} from "#helpers";

/** Elements that never have an end tag. */
const VOID_ELEMENTS: ReadonlySet<string> = new Set([
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "link",
  "meta",
  "param",
  "source",
  "track",
  "wbr",
]);

/** Elements whose end tag HTML makes optional; not worth flagging. */
const OPTIONAL_END_TAG: ReadonlySet<string> = new Set([
  "body",
  "caption",
  "colgroup",
  "dd",
  "dt",
  "head",
  "html",
  "li",
  "optgroup",
  "option",
  "p",
  "rb",
  "rp",
  "rt",
  "rtc",
  "tbody",
  "td",
  "tfoot",
  "th",
  "thead",
  "tr",
]);

/**
 * Duplicate attributes are a parse error too, but they are the subject of
 * `no-duplicate-template-bindings`; reporting them here as well would double up.
 */
const DELEGATED_CODES: ReadonlySet<string> = new Set(["duplicate-attribute"]);

/** The message for each parse error code worth explaining. */
const CODE_MESSAGES: ReadonlyMap<string, string> = new Map([
  ["invalid-first-character-of-tag-name", "strayLessThan"],
  ["eof-in-tag", "unterminatedTag"],
  ["eof-before-tag-name", "unterminatedTag"],
  ["missing-end-tag-name", "missingEndTagName"],
  ["unexpected-character-in-attribute-name", "attributeNameCharacter"],
  ["unexpected-character-in-unquoted-attribute-value", "unquotedValueCharacter"],
  ["missing-whitespace-between-attributes", "missingWhitespace"],
  ["unexpected-solidus-in-tag", "unexpectedSolidus"],
  ["eof-in-comment", "unterminatedComment"],
]);

/** Reports one parse error, on a range clamped to text the reader can see. */
function reportParseError(
  context: LitRuleContext,
  source: TemplateSource,
  error: ParserError,
): void {
  // Tokenizer errors point at the character after the offending `<`,
  // and end-of-input errors point past the end of the text; clamp both
  // so the diagnostic lands on something the reader can see.
  const stray = error.code === "invalid-first-character-of-tag-name";
  const unclamped = stray ? error.startOffset - 1 : error.startOffset;
  const start = Math.max(0, Math.min(unclamped, source.text.length - 1));
  const end = Math.max(error.endOffset, start + 1);
  const range = source.toSourceRange(start, end);
  const messageId = CODE_MESSAGES.get(error.code);
  context.report({
    loc: rangeLoc(context.sourceCode, range),
    ...(messageId === undefined
      ? { messageId: "parseError", data: { code: error.code } }
      : { messageId }),
    ...(stray && source.text[start] === "<"
      ? {
          suggest: [
            {
              messageId: "escapeLessThan",
              fix: (fixer) => fixer.replaceTextRange([range[0], range[0] + 1], "&lt;"),
            },
          ],
        }
      : {}),
  });
}

/** Reports an element with a start tag but no end tag, unless HTML allows that. */
function checkClosed(
  context: LitRuleContext,
  source: TemplateSource,
  element: ParsedElement,
): void {
  const location = element.sourceCodeLocation;
  const startTag = location?.startTag;
  if (location === undefined || location === null || startTag === undefined) {
    return;
  }
  if (location.endTag !== undefined) {
    return;
  }
  const tag = element.tagName.toLowerCase();
  if (VOID_ELEMENTS.has(tag) || OPTIONAL_END_TAG.has(tag)) {
    return;
  }
  if (source.text.slice(startTag.startOffset, startTag.endOffset).endsWith("/>")) {
    return;
  }
  context.report({
    loc: rangeLoc(
      context.sourceCode,
      source.toSourceRange(startTag.startOffset, startTag.endOffset),
    ),
    messageId: "unclosed",
    data: { tag },
  });
}

/**
 * `no-invalid-html` — rejects markup inside an `html` template that does not
 * parse as valid HTML.
 *
 * parse5 surfaces tokenizer problems through `onParseError`. It does not treat
 * an unclosed element as an error, so that case is found structurally: an
 * element with a start tag but no end tag, neither void nor self-closing, was
 * never closed.
 */
export const noInvalidHtmlRule: LitRule = {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow template markup that is not valid HTML",
      url: docsUrl("no-invalid-html"),
    },
    hasSuggestions: true,
    schema: [],
    messages: {
      strayLessThan: "Unexpected stray `<` in template markup.",
      unterminatedTag: "Unterminated tag in template markup.",
      missingEndTagName: "Missing end tag name in template markup.",
      attributeNameCharacter: "Invalid character in an attribute name.",
      unquotedValueCharacter: "Invalid character in an unquoted attribute value.",
      missingWhitespace: "Missing whitespace between attributes.",
      unexpectedSolidus: "Unexpected `/` in a tag.",
      unterminatedComment: "Unterminated comment in template markup.",
      parseError: "Invalid HTML in template ({{code}}).",
      unclosed: "Tag `<{{tag}}>` is never closed.",
      escapeLessThan: "Escape the `<` as `&lt;`.",
    },
  },
  create(context) {
    return {
      TaggedTemplateExpression(node: TSESTree.TaggedTemplateExpression): void {
        if (!isHtmlTemplate(node, context)) {
          return;
        }
        const source = templateSource(node);

        const errors: ParserError[] = [];
        const fragment = parseFragment(source.text, {
          sourceCodeLocationInfo: true,
          onParseError: (error) => {
            errors.push(error);
          },
        });

        for (const error of errors) {
          if (!DELEGATED_CODES.has(error.code)) {
            reportParseError(context, source, error);
          }
        }

        walkElements(fragment, (element) => {
          checkClosed(context, source, element);
        });
      },
    };
  },
};
