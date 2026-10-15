import { spanOf, testRule } from "#testing";

import { noDispatchInRenderRule } from "./no-dispatch-in-render.ts";

const LIT = 'import { html, LitElement } from "lit";\n';

const DISPATCH = { messageId: "dispatch" };

const highlightCode = `${LIT}class El extends LitElement {
  render() { this.dispatchEvent(new Event("x")); return html\`\`; }
}`;

testRule("no-dispatch-in-render", noDispatchInRenderRule, {
  valid: [
    // allows dispatch from other methods
    `${LIT}class El extends LitElement {
      onClick() { this.dispatchEvent(new CustomEvent("pick")); }
      render() { return html\`\`; }
    }`,

    // allows other calls in render
    `${LIT}class El extends LitElement {
      render() { return html\`\${this.format(this.value)}\`; }
    }`,

    // ignores non-Lit classes
    `class Plain {
      render() { this.dispatchEvent(new Event("x")); }
    }`,
  ],
  invalid: [
    // rejects dispatch on this, highlighting the call
    {
      code: highlightCode,
      errors: [
        {
          ...DISPATCH,
          data: { path: "this.dispatchEvent" },
          ...spanOf(highlightCode, 'this.dispatchEvent(new Event("x"))'),
        },
      ],
    },

    // rejects dispatch on another target
    {
      code: `${LIT}class El extends LitElement {
      render() { window.dispatchEvent(new Event("x")); return html\`\`; }
    }`,
      errors: [{ ...DISPATCH, data: { path: "window.dispatchEvent" } }],
    },

    // rejects dispatch in a nested callback
    {
      code: `${LIT}class El extends LitElement {
      render() {
        [1].forEach(() => { this.dispatchEvent(new Event("x")); });
        return html\`\`;
      }
    }`,
      errors: [DISPATCH],
    },
  ],
});
