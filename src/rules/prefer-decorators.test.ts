import { spanOf, testRule } from "#testing";

import { preferDecoratorsRule } from "./prefer-decorators.ts";

const IMPORT = 'import { LitElement } from "lit";\n';

const ERROR = { messageId: "staticProperties" };

const fieldCode = `${IMPORT}class A extends LitElement { static properties = { a: {} }; }`;

testRule("prefer-decorators", preferDecoratorsRule, {
  valid: [
    // allows decorated fields
    `${IMPORT}class A extends LitElement { @property() name = ""; @state() open = false; }`,

    // allows other static members
    `${IMPORT}class A extends LitElement { static styles = css\`\`; }`,
    `${IMPORT}class A extends LitElement { properties = {}; }`,

    // ignores non-Lit classes
    "class A { static properties = {}; }",
  ],
  invalid: [
    // rejects a static properties field, highlighting the member name
    { code: fieldCode, errors: [{ ...ERROR, ...spanOf(fieldCode, "properties") }] },
    {
      code: `${IMPORT}class A extends LitElement { static properties = { name: {} }; }`,
      errors: [ERROR],
    },

    // rejects a static properties getter
    {
      code: `${IMPORT}class A extends LitElement { static get properties() { return { name: {} }; } }`,
      errors: [ERROR],
    },
  ],
});
