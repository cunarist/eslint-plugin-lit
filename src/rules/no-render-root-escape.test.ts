import { spanOf, testRule } from "#testing";

import { noRenderRootEscapeRule } from "./no-render-root-escape.ts";

/** The Lit bases the snippets extend, imported so detection resolves them. */
const LIT = 'import { LitElement, ReactiveElement, render, adoptStyles } from "lit";\n';

const highlighted = `${LIT}class A extends LitElement { go() { findMatch(this.shadowRoot, '.item'); } }`;

testRule("no-render-root-escape", noRenderRootEscapeRule, {
  valid: [
    // allows passing a root around outside a component
    "class C { go() { findMatch(this.shadowRoot, '.item'); } }",
    "findMatch(document, '.item');",

    // allows calling methods on the render root
    `${LIT}class A extends LitElement { go() { this.renderRoot.addEventListener('x', on); } }`,
    `${LIT}class A extends LitElement { go() { return this.shadowRoot?.host; } }`,

    // allows Lit's own functions to take it
    `${LIT}class A extends LitElement { go() { render(html\`<p></p>\`, this.renderRoot); } }`,
    `${LIT}class A extends LitElement { go() { adoptStyles(this.shadowRoot!, []); } }`,
    `import * as lit from "lit";\nclass A extends lit.LitElement { go() { lit.render(x, this.renderRoot); } }`,

    // allows keeping it on the component
    `${LIT}class A extends LitElement { #root; go() { this.#root = this.renderRoot; } }`,
    `${LIT}class A extends LitElement { go() { const root = this.renderRoot; root.append(x); } }`,

    // allows reading it as a condition
    `${LIT}class A extends LitElement { go() { return this.shadowRoot ? 1 : 2; } }`,

    // allows other members of this
    `${LIT}class A extends LitElement { go() { findMatch(this.host, '.item'); } }`,
  ],
  invalid: [
    // rejects passing the shadow root to a helper, highlighting the member
    {
      code: highlighted,
      errors: [
        {
          messageId: "argument",
          data: { name: "this.shadowRoot" },
          ...spanOf(highlighted, "this.shadowRoot"),
        },
      ],
    },

    // rejects passing it through a non-null assertion or a constructor
    {
      code: `${LIT}class A extends LitElement { go() { find(this.renderRoot!); new Finder(this.renderRoot); } }`,
      errors: [
        { messageId: "argument", data: { name: "this.renderRoot" } },
        { messageId: "argument", data: { name: "this.renderRoot" } },
      ],
    },

    // rejects returning it, from a method or an arrow body
    {
      code: `${LIT}class A extends LitElement { get root() { return this.renderRoot; } f = () => this.shadowRoot; }`,
      errors: [
        { messageId: "returned", data: { name: "this.renderRoot" } },
        { messageId: "returned", data: { name: "this.shadowRoot" } },
      ],
    },

    // rejects storing it outside the component
    {
      code: `${LIT}let root;\nclass A extends LitElement { go() { root = this.renderRoot; registry.set({ root: this.shadowRoot }); list.push([this.renderRoot]); } }`,
      errors: [
        { messageId: "stored", data: { name: "this.renderRoot" } },
        { messageId: "stored", data: { name: "this.shadowRoot" } },
        { messageId: "stored", data: { name: "this.renderRoot" } },
      ],
    },

    // rejects it escaping through a local alias, reported at the use
    {
      code: `${LIT}class A extends LitElement { go() { const outlet = this.renderRoot; return find(outlet); } }`,
      errors: [{ messageId: "argument", data: { name: "this.renderRoot" }, line: 2, column: 81 }],
    },

    // rejects it on a ReactiveElement subclass too
    {
      code: `${LIT}class A extends ReactiveElement { go() { helper(this.renderRoot ?? document); } }`,
      errors: [{ messageId: "argument", data: { name: "this.renderRoot" } }],
    },
  ],
});
