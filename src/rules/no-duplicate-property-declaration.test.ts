import { spanOf, testRule } from "#testing";

import { noDuplicatePropertyDeclarationRule } from "./no-duplicate-property-declaration.ts";

const LIT =
  'import { LitElement } from "lit";\nimport { property, state } from "lit/decorators.js";\n';

const DUPLICATE = { messageId: "duplicate" };

const highlightCode = `${LIT}class El extends LitElement {
  static properties = { count: { type: Number } };
  @property({type: Number}) count = 0;
}`;

testRule("no-duplicate-property-declaration", noDuplicatePropertyDeclarationRule, {
  valid: [
    // allows decorators only
    `${LIT}class El extends LitElement {
      @property({type: Number}) count = 0;
      @state() open = false;
    }`,

    // allows static properties only
    `${LIT}class El extends LitElement {
      static properties = { count: { type: Number } };
    }`,

    // allows disjoint names in both styles
    `${LIT}class El extends LitElement {
      static properties = { count: { type: Number } };
      @property() label = "";
    }`,

    // ignores non-Lit classes
    `${LIT}class Plain {
      static properties = { count: { type: Number } };
      @property() count = 0;
    }`,
  ],
  invalid: [
    // rejects a name in both styles, highlighting the static properties key
    {
      code: highlightCode,
      errors: [{ ...DUPLICATE, data: { name: "count" }, ...spanOf(highlightCode, "count") }],
    },

    // rejects a @state name in static properties
    {
      code: `${LIT}class El extends LitElement {
      static properties = { open: { type: Boolean } };
      @state() open = false;
    }`,
      errors: [{ ...DUPLICATE, data: { name: "open" } }],
    },

    // reports each duplicate
    {
      code: `${LIT}class El extends LitElement {
      static properties = {
        count: { type: Number },
        label: { type: String },
        other: { type: String },
      };
      @property() count = 0;
      @property() label = "";
    }`,
      errors: [DUPLICATE, DUPLICATE],
    },
  ],
});
