import { spanOf, testRule } from "#testing";

import { attributeValueEntitiesRule } from "./attribute-value-entities.ts";

const LIT = 'import { html } from "lit";\n';

const highlightCode = `${LIT}const t = html\`<a title="a & b"></a>\`;`;

testRule("attribute-value-entities", attributeValueEntitiesRule, {
  valid: [
    // allows escaped values
    `${LIT}const t = html\`<a title="a &amp; b"></a>\`;`,
    `${LIT}const t = html\`<a title="a &lt; b"></a>\`;`,
    `${LIT}const t = html\`<a title="&#38;"></a>\`;`,
    `${LIT}const t = html\`<a title="&#x26;"></a>\`;`,
    `${LIT}const t = html\`<a title="plain"></a>\`;`,
    `${LIT}const t = html\`<a title></a>\`;`,

    // ignores binding values
    `${LIT}const t = html\`<a title=\${this.a && this.b}></a>\`;`,
    `${LIT}const t = html\`<a title="\${this.a > this.b}"></a>\`;`,
    `${LIT}const t = html\`<a @click=\${this.onClick}></a>\`;`,

    // ignores non-html templates
    'const t = sql`<a title="a & b"></a>`;',
  ],
  invalid: [
    // rejects a bare ampersand, highlighting it, and escapes it
    {
      code: highlightCode,
      output: `${LIT}const t = html\`<a title="a &amp; b"></a>\`;`,
      errors: [
        {
          messageId: "unescaped",
          data: { character: "&" },
          ...spanOf(highlightCode, "&"),
        },
      ],
    },

    // rejects unescaped angle brackets
    {
      code: `${LIT}const t = html\`<a title="a > b"></a>\`;`,
      output: `${LIT}const t = html\`<a title="a &gt; b"></a>\`;`,
      errors: [{ messageId: "unescaped", data: { character: ">" } }],
    },

    // flags text around a binding
    {
      code: `${LIT}const t = html\`<a title="\${this.a} & b"></a>\`;`,
      output: `${LIT}const t = html\`<a title="\${this.a} &amp; b"></a>\`;`,
      errors: [{ messageId: "unescaped" }],
    },

    // only suggests escaping an ampersand that may already be a reference
    {
      code: `${LIT}const t = html\`<a title="&copy x"></a>\`;`,
      errors: [
        {
          messageId: "unescaped",
          suggestions: [
            {
              messageId: "escape",
              data: { entity: "&amp;" },
              output: `${LIT}const t = html\`<a title="&amp;copy x"></a>\`;`,
            },
          ],
        },
      ],
    },
  ],
});
