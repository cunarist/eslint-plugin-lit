import { spanOf, testRule } from "#testing";

import { noInvalidHtmlRule } from "./no-invalid-html.ts";

/** Appended rather than prepended, so the snippet's own offsets stay put. */
const IMPORTS = '\nimport { html } from "lit";';

const unclosedCode = `const t = html\`<div><span></div>\`;${IMPORTS}`;

const strayCode = `const t = html\`<div>a < b</div>\`;${IMPORTS}`;

testRule("no-invalid-html", noInvalidHtmlRule, {
  valid: [
    // allows well-formed markup
    `const t = html\`<div></div>\`;${IMPORTS}`,
    `const t = html\`<div>\${this.name}</div>\`;${IMPORTS}`,
    `const t = html\`<x-y .prop=\${this.value}></x-y>\`;${IMPORTS}`,
    `const t = html\`<input .value=\${this.v}>\`;${IMPORTS}`,
    `const t = html\`<br/><hr>\`;${IMPORTS}`,
    `const t = html\`<ul><li>a<li>b</ul>\`;${IMPORTS}`,
    `const t = html\`<div>a &amp; b</div>\`;${IMPORTS}`,
    `const t = html\`\`;${IMPORTS}`,

    // leaves duplicate attributes to its own rule
    `const t = html\`<div a="1" a="2"></div>\`;${IMPORTS}`,

    // ignores non-html templates
    "const t = sql`<div>`;",
  ],
  invalid: [
    // rejects an unclosed tag
    {
      code: `const t = html\`<div>\`;${IMPORTS}`,
      errors: [{ messageId: "unclosed", data: { tag: "div" } }],
    },

    // rejects an unclosed tag inside another, highlighting its start tag
    {
      code: unclosedCode,
      errors: [{ messageId: "unclosed", data: { tag: "span" }, ...spanOf(unclosedCode, "<span>") }],
    },

    // rejects a stray `<`, highlighting it
    {
      code: strayCode,
      errors: [
        {
          messageId: "strayLessThan",
          ...spanOf(strayCode, "< "),
          endColumn: spanOf(strayCode, "< ").column + 1,
          suggestions: [
            {
              messageId: "escapeLessThan",
              output: `const t = html\`<div>a &lt; b</div>\`;${IMPORTS}`,
            },
          ],
        },
      ],
    },

    // rejects a truncated tag
    { code: `const t = html\`<div\`;${IMPORTS}`, errors: [{ messageId: "unterminatedTag" }] },
  ],
});
