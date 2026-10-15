import { spanOf, testRule } from "#testing";

import { noComponentDisposablesRule } from "./no-component-disposables.ts";

const LIT = 'import { html, LitElement } from "lit";\n';

const constructorCode = `${LIT}class A extends LitElement { #x; #onResize; go() { this.#x = new ResizeObserver(this.#onResize); } }`;

const methodCode = `${LIT}class A extends LitElement { #el; #on; go() { this.#el.addEventListener('x', this.#on); } }`;

testRule("no-component-disposables", noComponentDisposablesRule, {
  valid: [
    // allows resources in a controller
    "class C { #observer; #onResize; hostConnected() { this.#observer = new ResizeObserver(this.#onResize); } }",
    "class C { #observer; hostDisconnected() { this.#observer.disconnect(); } }",

    // allows ordinary component work
    `${LIT}class A extends LitElement { #onClick; render() { return html\`<b @click=\${this.#onClick}></b>\`; } }`,
  ],
  invalid: [
    // rejects each disposable constructor
    ...[
      "AbortController",
      "EventSource",
      "IntersectionObserver",
      "MutationObserver",
      "ResizeObserver",
      "WebSocket",
      "Worker",
    ].map((name) => ({
      code: `${LIT}class A extends LitElement { #x; go() { this.#x = new ${name}(); } }`,
      errors: [{ messageId: "construct", data: { name } }],
    })),

    // rejects each disposable method
    ...["addEventListener", "removeEventListener"].map((name) => ({
      code: `${LIT}class A extends LitElement { #x; go() { this.#x.${name}(); } }`,
      errors: [{ messageId: "call", data: { name } }],
    })),

    // highlights the constructor
    {
      code: constructorCode,
      errors: [
        {
          messageId: "construct",
          data: { name: "ResizeObserver" },
          ...spanOf(constructorCode, "ResizeObserver"),
        },
      ],
    },

    // highlights the method callee
    {
      code: methodCode,
      errors: [
        {
          messageId: "call",
          data: { name: "addEventListener" },
          ...spanOf(methodCode, "this.#el.addEventListener"),
        },
      ],
    },
  ],
});
