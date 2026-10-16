import { spanOf, testRule } from "#testing";

import { noPrivatePropertiesRule } from "./no-private-properties.ts";

/** Appended rather than prepended, so the snippet's own offsets stay put. */
const IMPORTS =
  '\nimport { LitElement } from "lit";\nimport { property, state } from "lit/decorators.js";';

const privateCode = `class El extends LitElement { @property({ type: Boolean }) accessor #open = false; }${IMPORTS}`;

testRule("no-private-properties", noPrivatePropertiesRule, {
  valid: [
    // accepts @state on a # field
    `class El extends LitElement { @state() accessor #open = false; }${IMPORTS}`,

    // accepts a public name
    `class El extends LitElement { @property({ type: Boolean }) accessor open = false; }${IMPORTS}`,

    // leaves underscore names alone: a convention, which some codebases use
    // for genuinely public fields
    `class El extends LitElement { @property({ type: Boolean }) accessor _open = false; }${IMPORTS}`,

    // ignores non-Lit classes
    `class Plain { @property({ type: Boolean }) accessor #open = false; }${IMPORTS}`,
  ],
  invalid: [
    // rejects @property on a # field, highlighting the field name
    {
      code: privateCode,
      errors: [{ messageId: "private", data: { name: "#open" }, ...spanOf(privateCode, "#open") }],
    },

    // checks static properties entries
    {
      code: `class El extends LitElement { static properties = { '#open': { type: Boolean } }; }${IMPORTS}`,
      errors: [{ messageId: "private", data: { name: "#open" } }],
    },
  ],
});
