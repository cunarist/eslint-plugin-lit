import { spanOf, testRule } from "#testing";

import { requireDispatchOnThisRule } from "./require-dispatch-on-this.ts";

const LIT = 'import { LitElement } from "lit";\n';

const busCode = `${LIT}class El extends LitElement {\n  go() { this.bus.dispatchEvent(new CustomEvent("edit")); }\n}`;

testRule("require-dispatch-on-this", requireDispatchOnThisRule, {
  valid: [
    // accepts dispatch on the component
    `${LIT}class El extends LitElement {\n  #go() { this.dispatchEvent(new CustomEvent("edit")); }\n}`,
    // ignores non-Lit classes
    "class Plain { go() { this.bus.dispatchEvent(new Event('x')); } }",
  ],
  invalid: [
    // rejects dispatch elsewhere: a parent's `@edit=` binding listens on the
    // element, so this never arrives
    {
      code: `${LIT}class El extends LitElement {\n  #bus = new EventTarget();\n  #go() { this.#bus.dispatchEvent(new CustomEvent("edit")); }\n}`,
      errors: [
        {
          messageId: "elsewhere",
          data: { receiver: "this.#bus" },
          suggestions: [
            {
              messageId: "onThis",
              output: `${LIT}class El extends LitElement {\n  #bus = new EventTarget();\n  #go() { this.dispatchEvent(new CustomEvent("edit")); }\n}`,
            },
          ],
        },
      ],
    },
    // highlights the call
    {
      code: busCode,
      errors: [
        {
          messageId: "elsewhere",
          data: { receiver: "this.bus" },
          ...spanOf(busCode, 'this.bus.dispatchEvent(new CustomEvent("edit"))'),
          suggestions: [
            {
              messageId: "onThis",
              output: `${LIT}class El extends LitElement {\n  go() { this.dispatchEvent(new CustomEvent("edit")); }\n}`,
            },
          ],
        },
      ],
    },
  ],
});
