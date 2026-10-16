import { spanOf, testRule } from "#testing";

import { noSelfClosingNonVoidRule } from "./no-self-closing-non-void.ts";

/** Appended rather than prepended, so the snippet's own offsets stay put. */
const IMPORTS = '\nimport { html, svg } from "lit";';

const divCode = `const t = html\`<div class="a" /><span></span>\`;${IMPORTS}`;

const bindingCode = `const t = html\`<my-el .foo=\${this.a} />\`;${IMPORTS}`;

testRule("no-self-closing-non-void", noSelfClosingNonVoidRule, {
  valid: [
    // allows explicit end tags
    `const t = html\`<div></div>\`;${IMPORTS}`,
    `const t = html\`<my-el></my-el>\`;${IMPORTS}`,
    `const t = html\`<div><span></span></div>\`;${IMPORTS}`,

    // allows void elements
    `const t = html\`<br />\`;${IMPORTS}`,
    `const t = html\`<img src="a.png" />\`;${IMPORTS}`,
    `const t = html\`<input type="text"/>\`;${IMPORTS}`,
    `const t = html\`<hr/><meta charset="utf-8"/>\`;${IMPORTS}`,

    // allows self-closing SVG content
    `const t = html\`<svg><path d="M0 0" /></svg>\`;${IMPORTS}`,
    `const t = svg\`<circle cx="1" />\`;${IMPORTS}`,

    // ignores a trailing slash inside an unquoted value
    `const t = html\`<a href=\${this.url}/>text</a>\`;${IMPORTS}`,

    // ignores non-html templates
    "const t = sql`<div />`;",
  ],
  invalid: [
    // rejects a self-closing div
    {
      code: `const t = html\`<div />\`;${IMPORTS}`,
      errors: [
        {
          messageId: "selfClosing",
          data: { tag: "div" },
          suggestions: [
            {
              messageId: "addEndTag",
              data: { tag: "div" },
              output: `const t = html\`<div></div>\`;${IMPORTS}`,
            },
          ],
        },
      ],
    },
    {
      code: `const t = html\`<div/>\`;${IMPORTS}`,
      errors: [
        {
          messageId: "selfClosing",
          suggestions: [
            {
              messageId: "addEndTag",
              data: { tag: "div" },
              output: `const t = html\`<div></div>\`;${IMPORTS}`,
            },
          ],
        },
      ],
    },

    // highlights the start tag
    {
      code: divCode,
      errors: [
        {
          messageId: "selfClosing",
          ...spanOf(divCode, '<div class="a" />'),
          suggestions: [
            {
              messageId: "addEndTag",
              data: { tag: "div" },
              output: `const t = html\`<div class="a"></div><span></span>\`;${IMPORTS}`,
            },
          ],
        },
      ],
    },

    // rejects a self-closing custom element, highlighting a start tag with a binding
    {
      code: bindingCode,
      errors: [
        {
          messageId: "selfClosing",
          data: { tag: "my-el" },
          ...spanOf(bindingCode, "<my-el .foo=${this.a} />"),
          suggestions: [
            {
              messageId: "addEndTag",
              data: { tag: "my-el" },
              output: `const t = html\`<my-el .foo=\${this.a}></my-el>\`;${IMPORTS}`,
            },
          ],
        },
      ],
    },
  ],
});
