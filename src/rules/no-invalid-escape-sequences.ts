import type { TSESTree } from "@typescript-eslint/types";

import {
  docsUrl,
  isHtmlTemplate,
  type LitRule,
  quasiOffsets,
  rangeLoc,
  templateSource,
} from "#helpers";

const HEX: RegExp = /^[\da-f]*$/iu;

/** A malformed escape found in a quasi's raw text. */
interface InvalidEscape {
  /** Offset of the backslash within the quasi's raw text. */
  index: number;
  /** Length of the offending sequence. */
  length: number;
  /** `x` or `u`. */
  kind: string;
}

/** Whether every character of a string is a hex digit. */
function allHex(text: string): boolean {
  return HEX.test(text);
}

/** A malformed `\u` escape at `index`, if the one there is malformed. */
function invalidUnicode(raw: string, index: number): InvalidEscape | null {
  if (raw[index + 2] === "{") {
    const close = raw.indexOf("}", index + 3);
    const body = close === -1 ? "" : raw.slice(index + 3, close);
    if (body.length > 0 && allHex(body)) {
      return null;
    }
    return { index, length: (close === -1 ? raw.length : close + 1) - index, kind: "u" };
  }
  const digits = raw.slice(index + 2, index + 6);
  if (digits.length === 4 && allHex(digits)) {
    return null;
  }
  return { index, length: 2 + digits.length, kind: "u" };
}

/** Find malformed `\x` and `\u` escapes, respecting escaped backslashes. */
function invalidEscapes(raw: string): InvalidEscape[] {
  const found: InvalidEscape[] = [];
  let index = raw.indexOf("\\");
  while (index !== -1) {
    const kind = raw[index + 1];
    if (kind === "x") {
      const digits = raw.slice(index + 2, index + 4);
      if (digits.length < 2 || !allHex(digits)) {
        found.push({ index, length: 2 + digits.length, kind: "x" });
      }
    } else if (kind === "u") {
      const invalid = invalidUnicode(raw, index);
      if (invalid !== null) {
        found.push(invalid);
      }
    }
    // Any escape, an escaped backslash included, consumes the next character.
    index = raw.indexOf("\\", index + 2);
  }
  return found;
}

/**
 * `no-invalid-escape-sequences` - rejects a malformed `\x` or `\u` escape
 * inside an `html` template.
 *
 * A tagged template makes a malformed escape legal to write while its cooked
 * value silently becomes `undefined`. Only `\x` and `\u` are checked: every
 * other escape is valid, so `\d` and `\w` in an inline pattern pass.
 */
export const noInvalidEscapeSequencesRule: LitRule = {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow malformed `\\x` and `\\u` escapes in templates",
      url: docsUrl("no-invalid-escape-sequences"),
    },
    hasSuggestions: true,
    schema: [],
    messages: {
      hex: "Invalid `\\x` escape sequence; `\\x` takes exactly two hex digits.",
      unicode: "Invalid `\\u` escape sequence; `\\u` takes four hex digits or `{...}`.",
      escapeBackslash: "Escape the backslash to keep it as literal text.",
    },
  },
  create(context) {
    return {
      TaggedTemplateExpression(node: TSESTree.TaggedTemplateExpression): void {
        if (!isHtmlTemplate(node, context)) {
          return;
        }
        const source = templateSource(node);
        const offsets = quasiOffsets(node);
        for (const [index, quasi] of node.quasi.quasis.entries()) {
          const offset = offsets[index] ?? 0;
          for (const invalid of invalidEscapes(quasi.value.raw)) {
            const start = offset + invalid.index;
            const backslash = source.toSourceOffset(start);
            context.report({
              loc: rangeLoc(
                context.sourceCode,
                source.toSourceRange(start, start + Math.max(1, invalid.length)),
              ),
              messageId: invalid.kind === "x" ? "hex" : "unicode",
              suggest: [
                {
                  messageId: "escapeBackslash",
                  fix: (fixer) => fixer.insertTextBeforeRange([backslash, backslash], "\\"),
                },
              ],
            });
          }
        }
      },
    };
  },
};
