import { spanOf, testRule } from "#testing";

import { preferStaticStylesRule } from "./prefer-static-styles.ts";

const LIT = 'import { html } from "lit";\n';

const STYLE = { messageId: "style" };

const nestedCode = `${LIT}const t = html\`<div><style>p{}</style></div>\`;`;

testRule("prefer-static-styles", preferStaticStylesRule, {
  valid: [
    // allows templates without a style element
    `${LIT}const t = html\`<div>\${this.name}</div>\`;`,
    `${LIT}const t = html\`<div style=\${this.css}></div>\`;`,
    `${LIT}const t = html\`<p>the style tag</p>\`;`,
    // ignores non-html templates
    "const t = sql`<style>p{}</style>`;",
  ],
  invalid: [
    // rejects a style element
    { code: `${LIT}const t = html\`<style>p { color: red; }</style>\`;`, errors: [STYLE] },
    // highlights the opening style tag
    { code: nestedCode, errors: [{ ...STYLE, ...spanOf(nestedCode, "<style>") }] },
  ],
});
