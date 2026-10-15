import { testRule } from "#testing";

import { noDuplicateTemplateBindingsRule } from "./no-duplicate-template-bindings.ts";

const LIT = 'import { html } from "lit";\n';

const propertyCode = `${LIT}const t = html\`<x-y .foo=\${this.a} .foo=\${this.b}></x-y>\`;`;

/** The second `.foo`, on the snippet's second line: `spanOf` finds the first. */
const secondColumn = propertyCode.lastIndexOf(".foo") - propertyCode.indexOf("\n");

testRule("no-duplicate-template-bindings", noDuplicateTemplateBindingsRule, {
  valid: [
    // allows distinct bindings
    `${LIT}const t = html\`<x-y a=\${this.a} b=\${this.b}></x-y>\`;`,
    `${LIT}const t = html\`<x-y></x-y><x-y></x-y>\`;`,
    `${LIT}const t = html\`<div a="1"></div><div a="2"></div>\`;`,

    // sigils are separate namespaces
    `${LIT}const t = html\`<x-y foo=\${this.a} .foo=\${this.b} ?foo=\${this.c} @foo=\${this.d}></x-y>\`;`,

    // ignores non-html templates
    'const t = sql`<div a="1" a="2"></div>`;',
  ],
  invalid: [
    // rejects a repeated attribute
    {
      code: `${LIT}const t = html\`<div a="1" a="2"></div>\`;`,
      errors: [
        {
          messageId: "duplicate",
          data: { kind: "attribute", name: "a" },
          suggestions: [
            { messageId: "remove", output: `${LIT}const t = html\`<div a="1"></div>\`;` },
          ],
        },
      ],
    },

    // rejects a repeated property, highlighting the second binding
    {
      code: propertyCode,
      errors: [
        {
          messageId: "duplicate",
          data: { kind: "property", name: ".foo" },
          line: 2,
          column: secondColumn,
          endLine: 2,
          endColumn: secondColumn + ".foo".length,
          suggestions: [
            {
              messageId: "remove",
              output: `${LIT}const t = html\`<x-y .foo=\${this.a}></x-y>\`;`,
            },
          ],
        },
      ],
    },

    // rejects a repeated listener
    {
      code: `${LIT}const t = html\`<x-y @go=\${this.a} @go=\${this.b}></x-y>\`;`,
      errors: [
        {
          messageId: "duplicate",
          data: { kind: "event listener", name: "@go" },
          suggestions: [
            {
              messageId: "remove",
              output: `${LIT}const t = html\`<x-y @go=\${this.a}></x-y>\`;`,
            },
          ],
        },
      ],
    },
  ],
});
