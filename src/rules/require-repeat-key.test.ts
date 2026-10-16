import { spanOf, testRule } from "#testing";

import { requireRepeatKeyRule } from "./require-repeat-key.ts";

const IMPORT = 'import { html } from "lit";\nimport { repeat } from "lit/directives/repeat.js";\n';

/** A snippet inside a method of a class that declares its private members. */
function inClass(body: string): string {
  return `${IMPORT}class List {\n  items = [];\n  #itemId = (item) => item;\n  #renderRow = (item) => item;\n  view() {\n    ${body}\n  }\n}`;
}

const NO_KEY = { messageId: "noKey" };

const twoArgumentCode = inClass("const rows = repeat(this.items, this.#renderRow);");

testRule("require-repeat-key", requireRepeatKeyRule, {
  valid: [
    // allows the three-argument form
    inClass("const rows = repeat(this.items, (item) => item.id, this.#renderRow);"),
    inClass("const rows = repeat(this.items, this.#itemId, this.#renderRow);"),
    // ignores unrelated calls
    `${IMPORT}const x = other(a, b);`,
    inClass("const x = this.repeat(a, b);"),
    `${IMPORT}const x = str.repeat(2);`,
    // ignores a spread that could supply the key
    `${IMPORT}const rows = repeat(...args);`,
    inClass("const rows = repeat(this.items, ...rest);"),
  ],
  invalid: [
    // rejects the two-argument form, highlighting the whole call
    {
      code: twoArgumentCode,
      errors: [{ ...NO_KEY, ...spanOf(twoArgumentCode, "repeat(this.items, this.#renderRow)") }],
    },
    // rejects it inside a template too
    {
      code: inClass("const t = html`<ul>${repeat(this.items, this.#renderRow)}</ul>`;"),
      errors: [NO_KEY],
    },
  ],
});
