import { spanOf, testRule } from "#testing";

import { requireScalarReflectRule } from "./require-scalar-reflect.ts";

const LIT = 'import { LitElement } from "lit";\nimport { property } from "lit/decorators.js";\n';

/** An expected report on the property `name`. */
function notScalar(name: string): { messageId: string; data: { name: string } } {
  return { messageId: "notScalar", data: { name } };
}

const objectCode = `${LIT}class El extends LitElement {\n  @property({type: Object, reflect: true}) data = {};\n}`;

testRule("require-scalar-reflect", requireScalarReflectRule, {
  valid: [
    // allows reflecting scalars
    `${LIT}class El extends LitElement {\n  @property({type: Boolean, reflect: true}) open = false;\n  @property({type: Number, reflect: true}) count = 0;\n  @property({type: String, reflect: true}) label = "";\n}`,
    // allows complex properties without reflect
    `${LIT}class El extends LitElement {\n  @property({type: Object}) data = {};\n  @property({type: Array, reflect: false}) items = [];\n}`,
    // ignores non-Lit classes
    `${LIT}class Plain {\n  @property({type: Object, reflect: true}) data = {};\n}`,
    // accepts a custom converter
    `${LIT}class El extends LitElement { @property({ reflect: true, converter: c }) accessor at; }`,
  ],
  invalid: [
    // rejects reflecting an object, highlighting the reflect option
    {
      code: objectCode,
      errors: [{ ...notScalar("data"), ...spanOf(objectCode, "reflect: true") }],
    },
    // rejects reflecting an array
    {
      code: `${LIT}class El extends LitElement {\n  @property({reflect: true, type: Array}) items = [];\n}`,
      errors: [notScalar("items")],
    },
    // rejects it in static properties
    {
      code: `${LIT}class El extends LitElement {\n  static properties = {\n    data: { type: Object, reflect: true },\n    count: { type: Number, reflect: true },\n  };\n}`,
      errors: [notScalar("data")],
    },
    // reports reflect with no type at all, where the identity converter writes
    // `[object Object]` into the DOM
    {
      code: `${LIT}class El extends LitElement { @property({ reflect: true }) accessor data = {}; }`,
      errors: [notScalar("data")],
    },
    // reports a type it cannot read
    {
      code: `${LIT}class El extends LitElement { @property({ reflect: true, type: TYPES.obj }) accessor d = {}; }`,
      errors: [notScalar("d")],
    },
  ],
});
