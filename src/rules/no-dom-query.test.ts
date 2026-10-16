import { spanOf, testRule } from "#testing";

import { noDomQueryRule } from "./no-dom-query.ts";

/** The Lit bases the snippets extend, imported so detection resolves them. */
const LIT = 'import { LitElement, ReactiveElement } from "lit";\n';

const highlighted = `${LIT}class A extends LitElement { go() { this.renderRoot.querySelector('input'); } }`;

testRule("no-dom-query", noDomQueryRule, {
  valid: [
    // allows querying outside a component
    "document.querySelector('#root');",
    "class C { find() { return root.querySelectorAll('a'); } }",

    // allows a ref callback in a component
    `${LIT}class A extends LitElement { #input; #onInput(el) { this.#input = el; } }`,
  ],
  invalid: [
    // rejects querySelector in a component, highlighting the callee
    {
      code: highlighted,
      errors: [
        {
          messageId: "domQuery",
          data: { name: "querySelector" },
          ...spanOf(highlighted, "this.renderRoot.querySelector"),
        },
      ],
    },

    // rejects querySelectorAll in a component
    {
      code: `${LIT}class A extends LitElement { go() { this.shadowRoot.querySelectorAll('li'); } }`,
      errors: [{ messageId: "domQuery", data: { name: "querySelectorAll" } }],
    },

    // rejects it on a ReactiveElement subclass too
    {
      code: `${LIT}class A extends ReactiveElement { go() { document.querySelector('b'); } }`,
      errors: [{ messageId: "domQuery", data: { name: "querySelector" } }],
    },
  ],
});
