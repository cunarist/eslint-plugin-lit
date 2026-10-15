import { spanOf, testRule } from "#testing";

import { noIndexAsRepeatKeyRule } from "./no-index-as-repeat-key.ts";

const IMPORT = 'import { repeat } from "lit/directives/repeat.js";\n';

// Deno's snippets passed `this.#renderRow`; Oxlint rejects a private name
// outside a class, so these use public members.
const INDEX = { messageId: "index" };

const highlightCode = `${IMPORT}const rows = repeat(this.items, (item, i) => i, this.renderRow);`;

testRule("no-index-as-repeat-key", noIndexAsRepeatKeyRule, {
  valid: [
    // allows an item-derived key
    `${IMPORT}const rows = repeat(this.items, (item) => item.id, this.renderRow);`,
    `${IMPORT}const rows = repeat(this.items, (item, i) => item.id, this.renderRow);`,
    `${IMPORT}const rows = repeat(this.items, this.itemId, this.renderRow);`,

    // ignores unrelated calls
    `${IMPORT}const x = other(a, (item, i) => i, c);`,
    `${IMPORT}const x = this.repeat(a, (item, i) => i, c);`,

    // ignores a key using the first parameter
    `${IMPORT}const rows = repeat(this.items, (item) => item, this.renderRow);`,
  ],
  invalid: [
    // rejects an index key, highlighting the key function
    { code: highlightCode, errors: [{ ...INDEX, ...spanOf(highlightCode, "(item, i) => i") }] },
    {
      code: `${IMPORT}const rows = repeat(this.items, (_, index) => index, this.renderRow);`,
      errors: [INDEX],
    },

    // rejects a block-bodied index key
    {
      code: `${IMPORT}const rows = repeat(this.items, (item, i) => { return i; }, this.renderRow);`,
      errors: [INDEX],
    },
    {
      code: `${IMPORT}const rows = repeat(this.items, function (item, i) { return i; }, this.renderRow);`,
      errors: [INDEX],
    },

    // rejects it inside a template too
    {
      code: `${IMPORT}const t = html\`<ul>\${repeat(this.items, (item, i) => i, this.renderRow)}</ul>\`;`,
      errors: [INDEX],
    },
  ],
});
