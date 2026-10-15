import { spanOf, testRule } from "#testing";

import { bindingPositionsRule } from "./binding-positions.ts";

const LIT = 'import { html } from "lit";\n';

const closingCode = `${LIT}const t = html\`<div></\${this.tag}>\`;`;

testRule("binding-positions", bindingPositionsRule, {
  valid: [
    // allows normal bindings
    `${LIT}const t = html\`<div>\${this.name}</div>\`;`,
    `${LIT}const t = html\`<div class=\${this.cls}></div>\`;`,
    `${LIT}const t = html\`<div @click=\${this.onClick}></div>\`;`,
    `${LIT}const t = html\`<x-y .prop=\${this.value}></x-y>\`;`,

    // ignores non-html templates
    "const t = sql`<${this.tag}>`;",
  ],
  invalid: [
    // rejects binding as tag name
    {
      code: `${LIT}const t = html\`<\${this.tag}></div>\`;`,
      errors: [{ messageId: "position", data: { what: "a tag name" } }],
    },

    // rejects binding in closing tag, highlighting the binding
    {
      code: closingCode,
      errors: [
        {
          messageId: "position",
          data: { what: "a closing tag" },
          ...spanOf(closingCode, "${this.tag}"),
        },
      ],
    },

    // rejects binding as attribute name
    {
      code: `${LIT}const t = html\`<div \${this.attr}="x"></div>\`;`,
      errors: [{ messageId: "position", data: { what: "an attribute name" } }],
    },
  ],
});
