import { spanOf, testRule } from "#testing";

import { noValueAttributeRule } from "./no-value-attribute.ts";

const LIT = 'import { html } from "lit";\n';

/** An expected report on a `<tag>`, offering the property binding. */
function attribute(
  tag: string,
  output: string,
): {
  messageId: string;
  data: { tag: string };
  suggestions: { messageId: string; output: string }[];
} {
  return {
    messageId: "attribute",
    data: { tag },
    suggestions: [{ messageId: "useProperty", output }],
  };
}

const inputCode = `${LIT}const t = html\`<input value=\${this.v}>\`;`;
const mixedCode = `${LIT}const t = html\`<input value="a\${this.v}">\`;`;

testRule("no-value-attribute", noValueAttributeRule, {
  valid: [
    // allows the property binding
    `${LIT}const t = html\`<input .value=\${this.v}>\`;`,
    `${LIT}const t = html\`<textarea .value=\${this.v}></textarea>\`;`,
    // allows a static default value
    `${LIT}const t = html\`<input value="5">\`;`,
    // ignores non-form elements
    `${LIT}const t = html\`<div value=\${this.v}></div>\`;`,
    `${LIT}const t = html\`<x-y value=\${this.v}></x-y>\`;`,
    // ignores non-html templates
    "const t = sql`<input value=${this.v}>`;",
  ],
  invalid: [
    // rejects a bound value attribute, highlighting the whole attribute
    {
      code: inputCode,
      errors: [
        {
          ...attribute("input", `${LIT}const t = html\`<input .value=\${this.v}>\`;`),
          ...spanOf(inputCode, "value=${this.v}"),
        },
      ],
    },
    {
      code: `${LIT}const t = html\`<select value=\${this.v}></select>\`;`,
      errors: [attribute("select", `${LIT}const t = html\`<select .value=\${this.v}></select>\`;`)],
    },
    {
      code: `${LIT}const t = html\`<textarea value="\${this.v}"></textarea>\`;`,
      errors: [
        attribute("textarea", `${LIT}const t = html\`<textarea .value="\${this.v}"></textarea>\`;`),
      ],
    },
    // offers no fix when the binding is only part of the value
    {
      code: mixedCode,
      errors: [{ messageId: "attribute", data: { tag: "input" }, suggestions: [] }],
    },
  ],
});
