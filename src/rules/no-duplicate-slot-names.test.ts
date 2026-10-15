import { testRule } from "#testing";

import { noDuplicateSlotNamesRule } from "./no-duplicate-slot-names.ts";

const LIT = 'import { html } from "lit";\n';

const DUPLICATE = { messageId: "duplicate" };

const repeatedCode = `${LIT}const t = html\`<slot name="a"></slot><slot name="a"></slot>\`;`;

/** The second `name="a"`, on the snippet's second line: `spanOf` finds the first. */
const secondColumn = repeatedCode.lastIndexOf('name="a"') - repeatedCode.indexOf("\n");

testRule("no-duplicate-slot-names", noDuplicateSlotNamesRule, {
  valid: [
    // allows distinct names
    `${LIT}const t = html\`<slot name="a"></slot><slot name="b"></slot>\`;`,
    `${LIT}const t = html\`<slot name="a"></slot>\`;`,
    `${LIT}const t = html\`<slot></slot>\`;`,
    `${LIT}const t = html\`<div></div>\`;`,

    // allows the same name in separate templates
    `${LIT}const a = html\`<slot name="x"></slot>\`;\nconst b = html\`<slot name="x"></slot>\`;`,

    // ignores bound names
    `${LIT}const t = html\`<slot name=\${this.a}></slot><slot name=\${this.b}></slot>\`;`,

    // ignores non-html templates
    'const t = sql`<slot name="a"></slot><slot name="a"></slot>`;',
  ],
  invalid: [
    // rejects a repeated name, highlighting the second name attribute
    {
      code: repeatedCode,
      errors: [
        {
          ...DUPLICATE,
          data: { name: "a" },
          line: 2,
          column: secondColumn,
          endLine: 2,
          endColumn: secondColumn + 'name="a"'.length,
        },
      ],
    },

    // rejects a repeat nested elsewhere
    {
      code: `${LIT}const t = html\`<slot name="a"></slot><div><slot name="a"></slot></div>\`;`,
      errors: [DUPLICATE],
    },

    // reports every slot after the first
    {
      code: `${LIT}const t = html\`<slot name="a"></slot><slot name="a"></slot><slot name="a"></slot>\`;`,
      errors: [DUPLICATE, DUPLICATE],
    },
  ],
});
