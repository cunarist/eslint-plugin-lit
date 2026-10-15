import { spanOf, testRule } from "#testing";

import { noUpdateCompleteRule } from "./no-update-complete.ts";

const IMPORT = 'import { LitElement } from "lit";\n';

const awaitCode = `${IMPORT}class A extends LitElement { async go() { await this.updateComplete; } }`;

const ERROR = { messageId: "updateComplete" };

testRule("no-update-complete", noUpdateCompleteRule, {
  valid: [
    // allows unrelated members
    `${IMPORT}class A extends LitElement { go() { this.items; } }`,
    "const done = this.complete;",

    // allows a same-named computed key
    'const done = this["updateComplete"];',
  ],
  invalid: [
    // rejects awaiting it, highlighting the member access
    { code: awaitCode, errors: [{ ...ERROR, ...spanOf(awaitCode, "this.updateComplete") }] },

    // rejects a then chain
    { code: "this.updateComplete.then(() => this.measure());", errors: [ERROR] },

    // rejects it on a controller host
    { code: "class C { #host; sync() { this.#host.updateComplete; } }", errors: [ERROR] },
  ],
});
