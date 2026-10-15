import { spanOf, testRule } from "#testing";

import { noCamelcaseAttributeRule } from "./no-camelcase-attribute.ts";

/** The Lit tags the snippets use, imported so detection resolves them. */
const LIT = 'import { html } from "lit";\n';

const highlighted = `${LIT}const t = html\`<x-y myProp=\${this.v}></x-y>\`;`;
const staticValue = `${LIT}const t = html\`<x-y itemCount="3"></x-y>\`;`;
const snake = `${LIT}const t = html\`<x-y my_prop=\${this.v}></x-y>\`;`;
const two = `${LIT}const t = html\`<x-y aBc=\${this.v} dEf=\${this.w}></x-y>\`;`;

testRule("no-camelcase-attribute", noCamelcaseAttributeRule, {
  valid: [
    // allows lowercase attributes
    `${LIT}const t = html\`<x-y my-prop=\${this.v}></x-y>\`;`,
    `${LIT}const t = html\`<div data-id="1" tabindex="0"></div>\`;`,

    // allows the case-sensitive sigils
    `${LIT}const t = html\`<x-y .myProp=\${this.v}></x-y>\`;`,
    `${LIT}const t = html\`<x-y @myEvent=\${this.v}></x-y>\`;`,
    `${LIT}const t = html\`<x-y ?myFlag=\${this.v}></x-y>\`;`,

    // allows camelCase in SVG content
    `${LIT}const t = html\`<svg viewBox="0 0 1 1"></svg>\`;`,
    `${LIT}const t = html\`<svg><linearGradient gradientUnits="userSpaceOnUse"></linearGradient></svg>\`;`,

    // defers className and htmlFor to no-jsx-attribute-names
    `${LIT}const t = html\`<div className=\${this.a}></div>\`;`,
    `${LIT}const t = html\`<label htmlFor=\${this.id}></label>\`;`,

    // ignores non-html templates
    "const t = sql`<x-y myProp=${this.v}></x-y>`;",
  ],
  invalid: [
    // rejects a camelCase attribute, highlighting the attribute name
    {
      code: highlighted,
      errors: [
        {
          messageId: "uppercase",
          data: { name: "myProp" },
          ...spanOf(highlighted, "myProp"),
          suggestions: [
            {
              messageId: "lowercase",
              data: { lowercase: "myprop" },
              output: highlighted.replace("myProp", "myprop"),
            },
            {
              messageId: "property",
              data: { name: "myProp" },
              output: highlighted.replace("myProp", ".myProp"),
            },
          ],
        },
      ],
    },
    {
      code: staticValue,
      errors: [
        {
          messageId: "uppercase",
          data: { name: "itemCount" },
          suggestions: [
            {
              messageId: "lowercase",
              output: staticValue.replace("itemCount", "itemcount"),
            },
          ],
        },
      ],
    },

    // rejects a snake_case attribute
    {
      code: snake,
      errors: [
        {
          messageId: "snakeCase",
          data: { name: "my_prop" },
          suggestions: [
            {
              messageId: "kebab",
              data: { kebab: "my-prop" },
              output: snake.replace("my_prop", "my-prop"),
            },
          ],
        },
      ],
    },

    // reports each offender
    {
      code: two,
      errors: [
        {
          messageId: "uppercase",
          data: { name: "aBc" },
          suggestions: [
            { messageId: "lowercase", output: two.replace("aBc", "abc") },
            { messageId: "property", output: two.replace("aBc", ".aBc") },
          ],
        },
        {
          messageId: "uppercase",
          data: { name: "dEf" },
          suggestions: [
            { messageId: "lowercase", output: two.replace("dEf", "def") },
            { messageId: "property", output: two.replace("dEf", ".dEf") },
          ],
        },
      ],
    },
  ],
});
