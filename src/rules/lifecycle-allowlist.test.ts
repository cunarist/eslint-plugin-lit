import { spanOf, testRule } from "#testing";

import { lifecycleAllowlistRule } from "./lifecycle-allowlist.ts";

const LIT = 'import { css, html, LitElement } from "lit";\n';

/** An expected `override` error for the given member. */
function override(name: string): { messageId: string; data: { name: string } } {
  return { messageId: "override", data: { name } };
}

const highlightCode = `${LIT}class A extends LitElement { firstUpdated() {} }`;

testRule("lifecycle-allowlist", lifecycleAllowlistRule, {
  valid: [
    // allows styles and render
    `${LIT}class A extends LitElement {
      static styles = css\`\`;
      render() { return html\`\`; }
    }`,

    // allows ordinary members
    `${LIT}class A extends LitElement { #items = []; #onClick() {} }`,

    // ignores non-Lit classes
    "class A { connectedCallback() {} }",
    "class A extends HTMLElement { connectedCallback() {} }",
  ],
  invalid: [
    // rejects willUpdate: pushing state into a controller belongs in a
    // property setter, not a hook
    {
      code: `${LIT}class A extends LitElement {
      willUpdate(changed) {}
      render() { return html\`\`; }
    }`,
      errors: [override("willUpdate")],
    },

    // rejects connect/disconnect overrides
    {
      code: `${LIT}class A extends LitElement { connectedCallback() {} }`,
      errors: [override("connectedCallback")],
    },
    {
      code: `${LIT}class A extends LitElement { disconnectedCallback() {} }`,
      errors: [override("disconnectedCallback")],
    },

    // rejects the whole banned set
    ...[
      "updated",
      "shouldUpdate",
      "update",
      "performUpdate",
      "requestUpdate",
      "scheduleUpdate",
    ].map((name) => ({
      code: `${LIT}class A extends LitElement { ${name}() {} }`,
      errors: [override(name)],
    })),

    // rejects a lifecycle field, not just a method
    {
      code: `${LIT}class A extends LitElement { updated = () => {}; }`,
      errors: [override("updated")],
    },

    // reports each override separately
    {
      code: `${LIT}class A extends LitElement { firstUpdated() {} updated() {} }`,
      errors: [override("firstUpdated"), override("updated")],
    },

    // highlights the member name
    {
      code: highlightCode,
      errors: [{ ...override("firstUpdated"), ...spanOf(highlightCode, "firstUpdated") }],
    },
  ],
});
