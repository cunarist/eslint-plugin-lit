import { spanOf, testRule } from "#testing";

import { noAsyncLifecycleRule } from "./no-async-lifecycle.ts";

const LIT = 'import { LitElement } from "lit";\n';

/** Every hook the rule rejects when async. */
const HOOKS = [
  "willUpdate",
  "update",
  "shouldUpdate",
  "firstUpdated",
  "updated",
  "connectedCallback",
  "disconnectedCallback",
];

const highlightCode = `${LIT}class El extends LitElement {
  async firstUpdated() { await 0; }
}`;

testRule("no-async-lifecycle", noAsyncLifecycleRule, {
  valid: [
    // allows synchronous hooks
    `${LIT}class El extends LitElement {
      willUpdate() {}
      updated() {}
      connectedCallback() { super.connectedCallback(); }
    }`,

    // allows async performUpdate
    `${LIT}class El extends LitElement {
      async performUpdate() { await 0; super.performUpdate(); }
    }`,

    // allows async on ordinary methods
    `${LIT}class El extends LitElement {
      async loadItems() { await fetch("/x"); }
    }`,

    // ignores non-Lit classes
    `class Plain {
      async updated() {}
    }`,
  ],
  invalid: [
    // rejects async willUpdate
    {
      code: `${LIT}class El extends LitElement {
      async willUpdate() { await this.load(); }
    }`,
      errors: [{ messageId: "async", data: { name: "willUpdate" } }],
    },

    // rejects each banned hook
    ...HOOKS.map((hook) => ({
      code: `${LIT}class El extends LitElement {
        async ${hook}() { await 0; }
      }`,
      errors: [{ messageId: "async", data: { name: hook } }],
    })),

    // highlights the hook name
    {
      code: highlightCode,
      errors: [{ messageId: "async", ...spanOf(highlightCode, "firstUpdated") }],
    },
  ],
});
