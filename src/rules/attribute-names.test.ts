import { spanOf, testRule } from "#testing";

import { attributeNamesRule } from "./attribute-names.ts";

/** The Lit imports the snippets use, so detection resolves them. */
const LIT = `import { LitElement } from "lit";
import { property, state } from "lit/decorators.js";
`;

const highlighted = `${LIT}class El extends LitElement {
  @property() myProp = "";
}`;

const withOptions = `${LIT}class El extends LitElement {
  @property({ type: Boolean, reflect: true }) isOpen = false;
}`;

const staticProperties = `${LIT}class El extends LitElement {
  static properties = { myProp: { type: String }, label: { type: String } };
}`;

testRule("attribute-names", attributeNamesRule, {
  valid: [
    // allows all-lowercase property names
    `${LIT}class El extends LitElement {
      @property() label = "";
      @property({ type: Number }) count = 0;
    }`,

    // allows an explicit attribute name
    `${LIT}class El extends LitElement {
      @property({ attribute: "my-prop" }) myProp = "";
      @property({ attribute: false }) internalValue = "";
    }`,

    // ignores @state and undecorated fields
    `${LIT}class El extends LitElement {
      @state() isOpen = false;
      someField = 1;
    }`,

    // ignores non-Lit classes
    `${LIT}class Plain {
      @property() myProp = "";
    }`,
  ],
  invalid: [
    // rejects a camelCase property with no attribute option, highlighting the
    // property name
    {
      code: highlighted,
      errors: [
        {
          messageId: "implicit",
          data: { name: "myProp", lowercase: "myprop" },
          ...spanOf(highlighted, "myProp"),
          suggestions: [
            {
              messageId: "nameAttribute",
              data: { attribute: "my-prop" },
              output: highlighted.replace("@property()", '@property({ attribute: "my-prop" })'),
            },
          ],
        },
      ],
    },

    // rejects when other options are given
    {
      code: withOptions,
      errors: [
        {
          messageId: "implicit",
          data: { name: "isOpen", lowercase: "isopen" },
          suggestions: [
            {
              messageId: "nameAttribute",
              data: { attribute: "is-open" },
              output: withOptions.replace("{ type", '{ attribute: "is-open", type'),
            },
          ],
        },
      ],
    },

    // rejects static properties entries
    {
      code: staticProperties,
      errors: [
        {
          messageId: "implicit",
          data: { name: "myProp", lowercase: "myprop" },
          suggestions: [
            {
              messageId: "nameAttribute",
              data: { attribute: "my-prop" },
              output: staticProperties.replace(
                "{ type: String }",
                '{ attribute: "my-prop", type: String }',
              ),
            },
          ],
        },
      ],
    },
  ],
});
