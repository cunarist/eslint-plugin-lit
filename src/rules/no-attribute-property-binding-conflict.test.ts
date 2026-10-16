import { spanOf, testRule } from "#testing";

import { noAttributePropertyBindingConflictRule } from "./no-attribute-property-binding-conflict.ts";

const LIT = 'import { html } from "lit";\n';

const propertySecond = `${LIT}const t = html\`<x-y foo=\${this.a} .foo=\${this.b}></x-y>\`;`;

const attributeSecond = `${LIT}const t = html\`<x-y .foo=\${this.a} foo="b"></x-y>\`;`;

// The attribute's name only: `foo` alone would match inside `.foo` first.
const attributeSpan = spanOf(attributeSecond, 'foo="b"');

testRule("no-attribute-property-binding-conflict", noAttributePropertyBindingConflictRule, {
  valid: [
    // allows one binding per name
    `${LIT}const t = html\`<x-y .foo=\${this.a}></x-y>\`;`,
    `${LIT}const t = html\`<x-y foo=\${this.a}></x-y>\`;`,
    `${LIT}const t = html\`<x-y foo=\${this.a} .bar=\${this.b}></x-y>\`;`,

    // allows other sigils alongside
    `${LIT}const t = html\`<x-y ?foo=\${this.a} @foo=\${this.b}></x-y>\`;`,

    // allows the same pair on different elements
    `${LIT}const t = html\`<x-y foo=\${this.a}></x-y><x-z .foo=\${this.b}></x-z>\`;`,

    // ignores non-html templates
    "const t = sql`<x-y foo=${this.a} .foo=${this.b}></x-y>`;",
  ],
  invalid: [
    // rejects attribute plus property, highlighting the second binding
    {
      code: propertySecond,
      errors: [
        {
          messageId: "conflict",
          data: { name: "foo" },
          ...spanOf(propertySecond, ".foo"),
          suggestions: [
            {
              messageId: "remove",
              output: `${LIT}const t = html\`<x-y foo=\${this.a}></x-y>\`;`,
            },
          ],
        },
      ],
    },

    // highlights the attribute when it is second
    {
      code: attributeSecond,
      errors: [
        {
          messageId: "conflict",
          ...attributeSpan,
          endColumn: attributeSpan.column + "foo".length,
          suggestions: [
            {
              messageId: "remove",
              output: `${LIT}const t = html\`<x-y .foo=\${this.a}></x-y>\`;`,
            },
          ],
        },
      ],
    },
  ],
});
