import { spanOf, testRule } from "#testing";

import { noInlineEventAttributeRule } from "./no-inline-event-attribute.ts";

const LIT = 'import { css, html } from "lit";\n';

const INLINE = { messageId: "inline", suggestions: [] };

const highlightCode = `${LIT}html\`<button onclick="doThing()">Go</button>\`;`;

testRule("no-inline-event-attribute", noInlineEventAttributeRule, {
  valid: [
    // allows Lit event bindings
    `${LIT}html\`<button @click=\${this.go}>Go</button>\`;`,
    `${LIT}html\`<div @pointerdown=\${this.down}></div>\`;`,

    // allows ordinary attributes
    `${LIT}html\`<button class="a" type="submit">Go</button>\`;`,

    // allows attributes that merely start with on
    `${LIT}html\`<wa-tooltip once="true" only="a"></wa-tooltip>\`;`,

    // ignores non-html templates
    `${LIT}css\`button { color: red; }\`;`,
    'other`<button onclick="go()"></button>`;',
  ],
  invalid: [
    // rejects a string onclick handler, naming the matching Lit binding and
    // highlighting the whole attribute
    {
      code: highlightCode,
      errors: [
        {
          ...INLINE,
          data: { name: "onclick", event: "click" },
          ...spanOf(highlightCode, 'onclick="doThing()"'),
        },
      ],
    },

    // rejects a bound on* attribute, suggesting the event binding
    {
      code: `${LIT}html\`<button onclick=\${this.go}>Go</button>\`;`,
      errors: [
        {
          messageId: "inline",
          suggestions: [
            {
              messageId: "useBinding",
              output: `${LIT}html\`<button @click=\${this.go}>Go</button>\`;`,
            },
          ],
        },
      ],
    },

    // rejects a camelCase inline handler
    {
      code: `${LIT}html\`<div onMouseOver="hover()"></div>\`;`,
      errors: [{ ...INLINE, data: { name: "onmouseover", event: "mouseover" } }],
    },

    // reports each inline handler
    {
      code: `${LIT}html\`<button onclick="a()" onfocus="b()">Go</button>\`;`,
      errors: [INLINE, INLINE],
    },
  ],
});
