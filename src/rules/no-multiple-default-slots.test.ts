import { testRule } from "#testing";

import { noMultipleDefaultSlotsRule } from "./no-multiple-default-slots.ts";

/** Appended rather than prepended, so the snippet's own offsets stay put. */
const IMPORTS = '\nimport { html } from "lit";';

const twoCode = `const t = html\`<slot></slot><slot></slot>\`;${IMPORTS}`;

/** Where the second `<slot>` of `twoCode` starts, as ESLint counts columns. */
const secondSlot = twoCode.lastIndexOf("<slot>") + 1;

const EXTRA = { messageId: "extraDefault" };

testRule("no-multiple-default-slots", noMultipleDefaultSlotsRule, {
  valid: [
    // allows a single default slot
    `const t = html\`<slot></slot>\`;${IMPORTS}`,
    `const t = html\`<slot></slot><slot name="a"></slot>\`;${IMPORTS}`,
    `const t = html\`<slot name="a"></slot><slot name="b"></slot>\`;${IMPORTS}`,
    `const t = html\`<div></div>\`;${IMPORTS}`,

    // allows one default slot per template
    `const a = html\`<slot></slot>\`;\nconst b = html\`<slot></slot>\`;${IMPORTS}`,

    // ignores bound names
    `const t = html\`<slot name=\${this.a}></slot><slot name=\${this.b}></slot>\`;${IMPORTS}`,

    // ignores non-html templates
    "const t = sql`<slot></slot><slot></slot>`;",
  ],
  invalid: [
    // rejects two unnamed slots, highlighting the second start tag
    {
      code: twoCode,
      errors: [{ ...EXTRA, line: 1, column: secondSlot, endLine: 1, endColumn: secondSlot + 6 }],
    },

    // treats an empty name as default
    { code: `const t = html\`<slot></slot><slot name=""></slot>\`;${IMPORTS}`, errors: [EXTRA] },

    // reports every slot after the first
    {
      code: `const t = html\`<slot></slot><div><slot></slot></div><slot></slot>\`;${IMPORTS}`,
      errors: [EXTRA, EXTRA],
    },
  ],
});
