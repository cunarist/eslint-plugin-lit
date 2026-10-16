import { spanOf, testRule } from "#testing";

import { noRequestUpdateInUpdatedRule } from "./no-request-update-in-updated.ts";

/** Appended rather than prepended, so the snippet's own offsets stay put. */
const IMPORTS = '\nimport { LitElement } from "lit";';

const highlightCode = `class El extends LitElement {
  updated() { this.requestUpdate(); }
}${IMPORTS}`;

testRule("no-request-update-in-updated", noRequestUpdateInUpdatedRule, {
  valid: [
    // allows requestUpdate elsewhere
    `class El extends LitElement {
  onResize() { this.requestUpdate(); }
  updated() {}
}${IMPORTS}`,

    // allows other calls in updated
    `class El extends LitElement {
  updated() { this.measure(); }
}${IMPORTS}`,

    // allows a host requestUpdate
    `class El extends LitElement {
  updated() { this.host.requestUpdate(); }
}${IMPORTS}`,

    // ignores non-Lit classes
    `class Plain {
  updated() { this.requestUpdate(); }
}${IMPORTS}`,
  ],
  invalid: [
    // rejects it in updated, highlighting the call
    {
      code: highlightCode,
      errors: [
        {
          messageId: "request",
          data: { hook: "updated" },
          ...spanOf(highlightCode, "this.requestUpdate()"),
        },
      ],
    },

    // rejects it in firstUpdated
    {
      code: `class El extends LitElement {
  firstUpdated() { this.requestUpdate(); }
}${IMPORTS}`,
      errors: [{ messageId: "request", data: { hook: "firstUpdated" } }],
    },

    // rejects it in a nested block
    {
      code: `class El extends LitElement {
  updated() { if (this.dirty) { this.requestUpdate(); } }
}${IMPORTS}`,
      errors: [{ messageId: "request", data: { hook: "updated" } }],
    },
  ],
});
