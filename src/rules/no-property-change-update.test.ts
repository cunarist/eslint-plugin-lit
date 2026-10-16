import { spanOf, testRule } from "#testing";

import { noPropertyChangeUpdateRule } from "./no-property-change-update.ts";

/** Appended rather than prepended, so the snippet's own offsets stay put. */
const IMPORTS =
  '\nimport { LitElement } from "lit";\nimport { property, state } from "lit/decorators.js";';

const highlightCode = `class El extends LitElement {
  @property() name = "";
  update(changed) { this.name = "next"; super.update(changed); }
}${IMPORTS}`;

testRule("no-property-change-update", noPropertyChangeUpdateRule, {
  valid: [
    // allows changes outside update()
    `class El extends LitElement {
  @property() name = "";
  willUpdate() { this.name = "x"; }
  updated() { this.name = "y"; }
}${IMPORTS}`,

    // allows non-reactive fields in update()
    `class El extends LitElement {
  @property() name = "";
  #cache = 0;
  update(changed) { this.#cache = 1; super.update(changed); }
}${IMPORTS}`,

    // ignores non-Lit classes
    `class Plain {
  @property() name = "";
  update() { this.name = "x"; }
}${IMPORTS}`,
  ],
  invalid: [
    // rejects assignment to a decorated property, highlighting the assignment
    {
      code: highlightCode,
      errors: [
        {
          messageId: "change",
          data: { name: "name" },
          ...spanOf(highlightCode, 'this.name = "next"'),
        },
      ],
    },
    {
      code: `class El extends LitElement {
  @property() name = "";
  update(changed) { this.name = "x"; super.update(changed); }
}${IMPORTS}`,
      errors: [{ messageId: "change", data: { name: "name" } }],
    },

    // rejects assignment to a @state property
    {
      code: `class El extends LitElement {
  @state() open = false;
  update(changed) { this.open = true; super.update(changed); }
}${IMPORTS}`,
      errors: [{ messageId: "change", data: { name: "open" } }],
    },

    // rejects static properties entries
    {
      code: `class El extends LitElement {
  static properties = { name: { type: String } };
  update(changed) { this.name = "x"; super.update(changed); }
}${IMPORTS}`,
      errors: [{ messageId: "change", data: { name: "name" } }],
    },

    // rejects increment of a reactive property
    {
      code: `class El extends LitElement {
  @property({ type: Number }) count = 0;
  update(changed) { this.count++; super.update(changed); }
}${IMPORTS}`,
      errors: [{ messageId: "change", data: { name: "count" } }],
    },

    // rejects changes in a nested callback
    {
      code: `class El extends LitElement {
  @property() name = "";
  update(changed) { [1].forEach(() => { this.name = "x"; }); }
}${IMPORTS}`,
      errors: [{ messageId: "change", data: { name: "name" } }],
    },
  ],
});
