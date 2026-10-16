import { spanOf, testRule } from "#testing";

import { noAsyncRenderRule } from "./no-async-render.ts";

const LIT = 'import { html, LitElement } from "lit";\n';

const ASYNC = { messageId: "async" };

const highlightCode = `${LIT}class El extends LitElement {
  async render() { return html\`\`; }
}`;

testRule("no-async-render", noAsyncRenderRule, {
  valid: [
    // allows a synchronous render
    `${LIT}class El extends LitElement {
      render() { return html\`<p></p>\`; }
    }`,

    // allows async on other methods
    `${LIT}class El extends LitElement {
      async load() { await fetch("/x"); }
      render() { return html\`\`; }
    }`,

    // ignores non-Lit classes
    `class Plain {
      async render() { return 1; }
    }`,

    // ignores a static render
    `${LIT}class El extends LitElement {
      static async render() { return 1; }
    }`,
  ],
  invalid: [
    // rejects async render, highlighting the method name
    { code: highlightCode, errors: [{ ...ASYNC, ...spanOf(highlightCode, "render") }] },

    // rejects on a ReactiveElement subclass
    {
      code: `import { ReactiveElement } from "@lit/reactive-element";
import { html } from "lit";
class El extends ReactiveElement {
      async render() { return html\`\`; }
    }`,
      errors: [ASYNC],
    },
  ],
});
