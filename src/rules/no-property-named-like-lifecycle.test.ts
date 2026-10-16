import { spanOf, testRule } from "#testing";

import { noPropertyNamedLikeLifecycleRule } from "./no-property-named-like-lifecycle.ts";

/** Appended rather than prepended, so the snippet's own offsets stay put. */
const IMPORTS =
  '\nimport { LitElement, html } from "lit";\nimport { property } from "lit/decorators.js";';

const highlightCode = `class El extends LitElement {
  @property() requestUpdate = 1;
}${IMPORTS}`;

testRule("no-property-named-like-lifecycle", noPropertyNamedLikeLifecycleRule, {
  valid: [
    // allows lifecycle methods
    `class El extends LitElement {
  render() { return html\`\`; }
  willUpdate() {}
  connectedCallback() { super.connectedCallback(); }
}${IMPORTS}`,

    // allows unrelated fields
    `class El extends LitElement {
  @property() label = "";
  updatedAt = 0;
  renderer = null;
}${IMPORTS}`,

    // allows a declare redeclaration
    `class El extends LitElement {
  declare update: () => void;
}${IMPORTS}`,

    // ignores non-Lit classes
    `class Plain {
  render = 1;
}${IMPORTS}`,
  ],
  invalid: [
    // rejects a field named render
    {
      code: `class El extends LitElement {
  render = 1;
}${IMPORTS}`,
      errors: [{ messageId: "lifecycle", data: { name: "render" } }],
    },

    // rejects an arrow field named update
    {
      code: `class El extends LitElement {
  update = () => {};
}${IMPORTS}`,
      errors: [{ messageId: "lifecycle", data: { name: "update" } }],
    },

    // rejects a decorated lifecycle name
    {
      code: `class El extends LitElement {
  @property({type: Boolean}) updated = false;
}${IMPORTS}`,
      errors: [{ messageId: "lifecycle", data: { name: "updated" } }],
    },

    // rejects an accessor named shouldUpdate
    {
      code: `class El extends LitElement {
  accessor shouldUpdate = true;
}${IMPORTS}`,
      errors: [{ messageId: "lifecycle", data: { name: "shouldUpdate" } }],
    },

    // rejects a lifecycle name in static properties
    {
      code: `class El extends LitElement {
  static properties = { firstUpdated: { type: Boolean } };
}${IMPORTS}`,
      errors: [{ messageId: "lifecycle", data: { name: "firstUpdated" } }],
    },

    // highlights the member name
    {
      code: highlightCode,
      errors: [
        {
          messageId: "lifecycle",
          data: { name: "requestUpdate" },
          ...spanOf(highlightCode, "requestUpdate"),
        },
      ],
    },
  ],
});
