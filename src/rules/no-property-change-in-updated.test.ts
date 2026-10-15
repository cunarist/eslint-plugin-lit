import { spanOf, testRule } from "#testing";

import { noPropertyChangeInUpdatedRule } from "./no-property-change-in-updated.ts";

/** Appended rather than prepended, so the snippet's own offsets stay put. */
const IMPORTS =
  '\nimport { LitElement } from "lit";\nimport { property, state } from "lit/decorators.js";';

const highlightCode = `class El extends LitElement {
  @state() count = 0;
  updated() { this.count = 1; }
}${IMPORTS}`;

testRule("no-property-change-in-updated", noPropertyChangeInUpdatedRule, {
  valid: [
    // allows non-reactive writes
    `class El extends LitElement {
  @property({ type: Number }) count = 0;
  cache = 0;
  updated() { this.cache = this.count; }
}${IMPORTS}`,

    // allows writes in willUpdate
    `class El extends LitElement {
  @state() count = 0;
  willUpdate() { this.count = 1; }
}${IMPORTS}`,

    // ignores non-Lit classes
    `class Plain {
  @property() count = 0;
  updated() { this.count = 1; }
}${IMPORTS}`,
  ],
  invalid: [
    // rejects a write in updated, highlighting the assignment
    {
      code: highlightCode,
      errors: [
        {
          messageId: "change",
          data: { name: "count", hook: "updated" },
          ...spanOf(highlightCode, "this.count = 1"),
        },
      ],
    },
    {
      code: `class El extends LitElement {
  @property({ type: Number }) count = 0;
  updated() { this.count = 1; }
}${IMPORTS}`,
      errors: [{ messageId: "change", data: { name: "count", hook: "updated" } }],
    },

    // rejects a write in firstUpdated
    {
      code: `class El extends LitElement {
  @state() ready = false;
  firstUpdated() { this.ready = true; }
}${IMPORTS}`,
      errors: [{ messageId: "change", data: { name: "ready", hook: "firstUpdated" } }],
    },

    // rejects an increment
    {
      code: `class El extends LitElement {
  @state() count = 0;
  updated() { this.count++; }
}${IMPORTS}`,
      errors: [{ messageId: "change", data: { name: "count", hook: "updated" } }],
    },

    // rejects static properties entries
    {
      code: `class El extends LitElement {
  static properties = { count: { type: Number } };
  updated() { this.count = 1; }
}${IMPORTS}`,
      errors: [{ messageId: "change", data: { name: "count", hook: "updated" } }],
    },
  ],
});
