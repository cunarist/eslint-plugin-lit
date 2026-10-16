import { spanOf, testRule } from "#testing";

import { requirePropertyTypeRule } from "./require-property-type.ts";

const LIT =
  'import { LitElement } from "lit";\nimport { property, state } from "lit/decorators.js";\n';

/** An expected report on the property `name`. */
function missing(name: string): { messageId: string; data: { name: string } } {
  return { messageId: "missingType", data: { name } };
}

const countCode = `${LIT}class El extends LitElement { @property() accessor count = 0; }`;

testRule("require-property-type", requirePropertyTypeRule, {
  valid: [
    // accepts a declared type
    `${LIT}class El extends LitElement { @property({ type: Number }) accessor count = 0; }`,
    `${LIT}class El extends LitElement { @property({ type: String }) accessor name = ""; }`,
    // accepts a custom converter, which replaces whatever `type` would select
    `${LIT}class El extends LitElement { @property({ converter: dateConverter }) accessor at; }`,
    // exempts properties with no attribute
    `${LIT}class El extends LitElement { @property({ attribute: false }) accessor onEdit = () => {}; }`,
    `${LIT}class El extends LitElement { @state() accessor internal = 0; }`,
    // leaves a spread alone: it could carry `type`
    `${LIT}class El extends LitElement { @property({ ...shared }) accessor x = 0; }`,
    // ignores non-Lit classes
    `${LIT}class Plain { @property() accessor x = 0; }`,
  ],
  invalid: [
    // requires a type when there is an attribute, highlighting the name
    { code: countCode, errors: [{ ...missing("count"), ...spanOf(countCode, "count") }] },
    {
      code: `${LIT}class El extends LitElement { @property() accessor name = ""; }`,
      errors: [missing("name")],
    },
    {
      code: `${LIT}class El extends LitElement { @property({ reflect: true }) accessor open = false; }`,
      errors: [missing("open")],
    },
    // catches what inference used to miss: a declared type the rule cannot
    // resolve is where the mistake is easiest to make
    {
      code: `${LIT}class El extends LitElement { @property() accessor count: number; }`,
      errors: [missing("count")],
    },
    {
      code: `${LIT}class El extends LitElement { @property() accessor total: Count; }`,
      errors: [missing("total")],
    },
    {
      code: `${LIT}class El extends LitElement { @property() accessor cfg = makeConfig(); }`,
      errors: [missing("cfg")],
    },
  ],
});
