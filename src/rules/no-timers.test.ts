import { spanOf, testRule } from "#testing";

import { noTimersRule } from "./no-timers.ts";

const LIT = 'import { LitElement } from "lit";\n';

const highlightCode = `${LIT}class A extends LitElement { #tick; go() { queueMicrotask(this.#tick); } }`;

testRule("no-timers", noTimersRule, {
  valid: [
    // allows timers outside a component
    "setTimeout(() => run(), 10);",
    "class C { hostConnected() { setInterval(tick, 10); } }",

    // allows unrelated calls in a component
    `${LIT}class A extends LitElement { #load() {} go() { this.#load(); } }`,
  ],
  invalid: [
    // rejects each timer in a component
    ...["setTimeout", "setInterval", "requestAnimationFrame", "queueMicrotask"].map((name) => ({
      code: `${LIT}class A extends LitElement { go() { ${name}(() => this.x, 0); } }`,
      errors: [{ messageId: "timer", data: { name } }],
    })),

    // rejects a namespaced timer
    {
      code: `${LIT}class A extends LitElement { go() { globalThis.setTimeout(tick, 0); } }`,
      errors: [{ messageId: "timer", data: { name: "setTimeout" } }],
    },

    // highlights the callee
    {
      code: highlightCode,
      errors: [
        {
          messageId: "timer",
          data: { name: "queueMicrotask" },
          ...spanOf(highlightCode, "queueMicrotask"),
        },
      ],
    },
  ],
});
