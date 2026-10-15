import { spanOf, testRule } from "#testing";

import { noBooleanPropertyDefaultTrueRule } from "./no-boolean-property-default-true.ts";

const IMPORT = 'import { LitElement } from "lit";\n';

/** The expected report for `name`, whose suggestion leaves `output`. */
function truthy(
  name: string,
  output: string,
): {
  messageId: string;
  data: { name: string };
  suggestions: { messageId: string; output: string }[];
} {
  return {
    messageId: "truthyDefault",
    data: { name },
    suggestions: [{ messageId: "defaultFalse", output }],
  };
}

const highlightCode = `${IMPORT}class El extends LitElement {
  @property({type: Boolean}) open = true;
}`;

testRule("no-boolean-property-default-true", noBooleanPropertyDefaultTrueRule, {
  valid: [
    // allows a false default
    `${IMPORT}class El extends LitElement {
      @property({type: Boolean}) open = false;
      @property({type: Boolean}) disabled: boolean = false;
    }`,

    // allows non-boolean properties
    `${IMPORT}class El extends LitElement {
      @property({type: Number}) count = 1;
      @property() label = "x";
    }`,

    // allows attribute: false
    `${IMPORT}class El extends LitElement {
      @property({type: Boolean, attribute: false}) open = true;
    }`,

    // ignores @state
    `${IMPORT}class El extends LitElement {
      @state() open = true;
    }`,

    // ignores non-Lit classes
    `class Plain {
      @property({type: Boolean}) open = true;
    }`,

    // ignores an annotation without type: Boolean: the converter is then
    // String, so there is no boolean attribute to be asymmetric about
    `${IMPORT}class El extends LitElement {
      @property() accessor enabled: boolean = true;
    }`,

    // accepts no initializer
    `${IMPORT}class El extends LitElement { @property({ type: Boolean }) accessor open; }`,
  ],
  invalid: [
    // rejects an explicit boolean default, highlighting the default value
    {
      code: highlightCode,
      errors: [
        {
          ...truthy("open", highlightCode.replace("open = true", "open = false")),
          ...spanOf(highlightCode, "true"),
        },
      ],
    },

    // rejects it in static properties
    {
      code: `${IMPORT}class El extends LitElement {
      static properties = { open: { type: Boolean } };
      open = true;
    }`,
      errors: [
        truthy(
          "open",
          `${IMPORT}class El extends LitElement {
      static properties = { open: { type: Boolean } };
      open = false;
    }`,
        ),
      ],
    },

    // reports a computed default: only `false` and no initializer are
    // provably safe
    {
      code: `${IMPORT}class El extends LitElement { @property({ type: Boolean }) accessor open = DEFAULTS.open; }`,
      errors: [
        truthy(
          "open",
          `${IMPORT}class El extends LitElement { @property({ type: Boolean }) accessor open = false; }`,
        ),
      ],
    },
    {
      code: `${IMPORT}class El extends LitElement { @property({ type: Boolean }) accessor open = !!1; }`,
      errors: [
        truthy(
          "open",
          `${IMPORT}class El extends LitElement { @property({ type: Boolean }) accessor open = false; }`,
        ),
      ],
    },
  ],
});
