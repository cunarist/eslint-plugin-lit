import { spanOf, testRule } from "#testing";

import { noJsxAttributeNamesRule } from "./no-jsx-attribute-names.ts";

/** Appended rather than prepended, so the snippet's own offsets stay put. */
const IMPORTS = '\nimport { html } from "lit";';

const classNameCode = `const t = html\`<div className=\${this.a}></div>\`;${IMPORTS}`;

testRule("no-jsx-attribute-names", noJsxAttributeNamesRule, {
  valid: [
    // allows the HTML spellings
    `const t = html\`<div class="a"></div>\`;${IMPORTS}`,
    `const t = html\`<label for=\${this.id}></label>\`;${IMPORTS}`,
    `const t = html\`<div class=\${this.classes}></div>\`;${IMPORTS}`,

    // allows the property bindings
    `const t = html\`<div .className=\${this.a}></div>\`;${IMPORTS}`,
    `const t = html\`<label .htmlFor=\${this.id}></label>\`;${IMPORTS}`,

    // ignores non-html templates
    'const t = sql`<div className="a"></div>`;',
  ],
  invalid: [
    // rejects className, highlighting the attribute name
    {
      code: classNameCode,
      errors: [
        {
          messageId: "jsxName",
          data: { name: "className", replacement: "class" },
          ...spanOf(classNameCode, "className"),
          suggestions: [
            {
              messageId: "rename",
              data: { replacement: "class" },
              output: `const t = html\`<div class=\${this.a}></div>\`;${IMPORTS}`,
            },
          ],
        },
      ],
    },
    {
      code: `const t = html\`<div classname="a"></div>\`;${IMPORTS}`,
      errors: [
        {
          messageId: "jsxName",
          data: { name: "classname", replacement: "class" },
          suggestions: [
            {
              messageId: "rename",
              data: { replacement: "class" },
              output: `const t = html\`<div class="a"></div>\`;${IMPORTS}`,
            },
          ],
        },
      ],
    },

    // rejects htmlFor
    {
      code: `const t = html\`<label htmlFor=\${this.id}></label>\`;${IMPORTS}`,
      errors: [
        {
          messageId: "jsxName",
          data: { name: "htmlFor", replacement: "for" },
          suggestions: [
            {
              messageId: "rename",
              data: { replacement: "for" },
              output: `const t = html\`<label for=\${this.id}></label>\`;${IMPORTS}`,
            },
          ],
        },
      ],
    },
  ],
});
