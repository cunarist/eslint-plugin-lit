import { spanOf, testRule } from "#testing";

import { noUselessTemplateLiteralsRule } from "./no-useless-template-literals.ts";

const LIT = 'import { html } from "lit";\n';

const loneCode = `${LIT}const t = html\`\${x}\`;`;
const memberCode = `${LIT}const t = html\`\${this.body}\`;`;
const sumCode = `${LIT}const t = html\`\${a + b}\`;`;

testRule("no-useless-template-literals", noUselessTemplateLiteralsRule, {
  valid: [
    // allows templates with markup
    `${LIT}const t = html\`<div>\${x}</div>\`;`,
    `${LIT}const t = html\`\${x}\${y}\`;`,
    `${LIT}const t = html\`text \${x}\`;`,
    `${LIT}const t = html\`\`;`,
    `${LIT}const t = html\`<div></div>\`;`,
    // ignores non-html templates
    "const t = sql`${x}`;",
  ],
  invalid: [
    // rejects a lone binding, offering its value
    {
      code: loneCode,
      errors: [
        {
          messageId: "lone",
          suggestions: [{ messageId: "useValue", output: `${LIT}const t = x;` }],
        },
      ],
    },
    // highlights the whole template
    {
      code: memberCode,
      errors: [
        {
          messageId: "lone",
          ...spanOf(memberCode, "html`${this.body}`"),
          suggestions: [{ messageId: "useValue", output: `${LIT}const t = this.body;` }],
        },
      ],
    },
    // keeps a looser expression in parentheses
    {
      code: sumCode,
      errors: [
        {
          messageId: "lone",
          suggestions: [{ messageId: "useValue", output: `${LIT}const t = (a + b);` }],
        },
      ],
    },
  ],
});
