import { testRule } from "#testing";

import { noDuplicateTagRegistrationRule } from "./no-duplicate-tag-registration.ts";

const LIT =
  'import { LitElement } from "lit";\nimport { customElement } from "lit/decorators.js";\n';

const DUPLICATE = { messageId: "duplicate" };

const highlightCode = `${LIT}@customElement("x-one")
class One extends LitElement {}
customElements.define("x-one", Other);`;

testRule("no-duplicate-tag-registration", noDuplicateTagRegistrationRule, {
  valid: [
    // allows distinct tags
    `${LIT}@customElement("x-one")
    class One extends LitElement {}
    @customElement("x-two")
    class Two extends LitElement {}`,

    // allows one decorator registration
    `${LIT}@customElement("x-one")
    export class One extends LitElement {}`,

    // allows one define call
    'customElements.define("x-one", One);',

    // allows define with a computed tag
    "customElements.define(tag, One); customElements.define(tag, Two);",
  ],
  invalid: [
    // rejects two decorators with one tag
    {
      code: `${LIT}@customElement("x-one")
    class One extends LitElement {}
    @customElement("x-one")
    class Two extends LitElement {}`,
      errors: [{ ...DUPLICATE, data: { tag: "x-one" } }],
    },

    // rejects two define calls
    {
      code: `customElements.define("x-one", One);
    customElements.define("x-one", Two);`,
      errors: [DUPLICATE],
    },

    // rejects a decorator plus a define, highlighting the later tag literal
    {
      code: highlightCode,
      errors: [{ ...DUPLICATE, line: 5, column: 23, endLine: 5, endColumn: 30 }],
    },

    // reports every extra registration
    {
      code: `customElements.define("x-one", A);
    customElements.define("x-one", B);
    customElements.define("x-one", C);`,
      errors: [DUPLICATE, DUPLICATE],
    },
  ],
});
