import { spanOf, testRule } from "#testing";

import { noNativeAttributesRule } from "./no-native-attributes.ts";

/** Appended rather than prepended, so the snippet's own offsets stay put. */
const IMPORTS =
  '\nimport { LitElement } from "lit";\nimport { property, state } from "lit/decorators.js";';

const highlightCode = `class El extends LitElement {
  @property() title = "";
}${IMPORTS}`;

/** A component declaring one reactive property with the given name. */
function declaring(name: string): string {
  return `class El extends LitElement {
  @property() ${name} = "";
}${IMPORTS}`;
}

testRule("no-native-attributes", noNativeAttributesRule, {
  valid: [
    // allows non-native names
    `class El extends LitElement {
  @property() label = "";
  @property() headingId = "";
  @state() open = false;
}${IMPORTS}`,

    // ignores undecorated fields
    `class El extends LitElement {
  title = "";
  #role = "";
}${IMPORTS}`,

    // ignores non-Lit classes
    `class Plain {
  @property() title = "";
}${IMPORTS}`,
  ],
  invalid: [
    // rejects native attribute names, highlighting the property name
    {
      code: highlightCode,
      errors: [{ messageId: "native", data: { name: "title" }, ...spanOf(highlightCode, "title") }],
    },
    ...["role", "id", "slot", "style", "hidden"].map((name) => ({
      code: declaring(name),
      errors: [{ messageId: "native", data: { name } }],
    })),

    // rejects case variants
    {
      code: `class El extends LitElement {
  @property({ type: Number }) tabIndex = 0;
}${IMPORTS}`,
      errors: [{ messageId: "native", data: { name: "tabIndex" } }],
    },

    // rejects static properties entries
    {
      code: `class El extends LitElement {
  static properties = { title: { type: String }, label: { type: String } };
}${IMPORTS}`,
      errors: [{ messageId: "native", data: { name: "title" } }],
    },
  ],
});
