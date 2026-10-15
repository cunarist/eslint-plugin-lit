import { spanOf, testRule } from "#testing";

import { noInvalidEscapeSequencesRule } from "./no-invalid-escape-sequences.ts";

/** Appended rather than prepended, so the snippet's own offsets stay put. */
const IMPORTS = '\nimport { html } from "lit";';

const highlightCode = `const t = html\`<div>\\xZZ</div>\`;${IMPORTS}`;

testRule("no-invalid-escape-sequences", noInvalidEscapeSequencesRule, {
  valid: [
    // allows valid escapes
    `const t = html\`<div>\\x41</div>\`;${IMPORTS}`,
    `const t = html\`<div>\\u0041</div>\`;${IMPORTS}`,
    `const t = html\`<div>\\u{1F600}</div>\`;${IMPORTS}`,
    `const t = html\`<div>\\n\\t</div>\`;${IMPORTS}`,
    `const t = html\`<div>\\\\x</div>\`;${IMPORTS}`,

    // leaves regex classes alone
    `const t = html\`<input pattern="\\d+\\w*">\`;${IMPORTS}`,

    // ignores non-html templates
    "const t = sql`\\xZZ`;",
  ],
  invalid: [
    // rejects a bad hex escape, highlighting the escape
    {
      code: highlightCode,
      errors: [
        {
          messageId: "hex",
          ...spanOf(highlightCode, "\\xZZ"),
          suggestions: [
            {
              messageId: "escapeBackslash",
              output: `const t = html\`<div>\\\\xZZ</div>\`;${IMPORTS}`,
            },
          ],
        },
      ],
    },

    // rejects a short unicode escape
    {
      code: `const t = html\`<div>\\u00</div>\`;${IMPORTS}`,
      errors: [
        {
          messageId: "unicode",
          suggestions: [
            {
              messageId: "escapeBackslash",
              output: `const t = html\`<div>\\\\u00</div>\`;${IMPORTS}`,
            },
          ],
        },
      ],
    },

    // rejects a bad code point escape
    {
      code: `const t = html\`<div>\\u{ZZ}</div>\`;${IMPORTS}`,
      errors: [
        {
          messageId: "unicode",
          suggestions: [
            {
              messageId: "escapeBackslash",
              output: `const t = html\`<div>\\\\u{ZZ}</div>\`;${IMPORTS}`,
            },
          ],
        },
      ],
    },

    // checks every quasi
    {
      code: `const t = html\`<div>\${this.a}\\xZZ</div>\`;${IMPORTS}`,
      errors: [
        {
          messageId: "hex",
          suggestions: [
            {
              messageId: "escapeBackslash",
              output: `const t = html\`<div>\${this.a}\\\\xZZ</div>\`;${IMPORTS}`,
            },
          ],
        },
      ],
    },
  ],
});
