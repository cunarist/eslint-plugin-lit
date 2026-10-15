import { spanOf, testRule } from "#testing";

import { composedRequiresBubblesRule } from "./composed-requires-bubbles.ts";

const highlightCode = 'this.dispatchEvent(new CustomEvent("close", { composed: true }));';

testRule("composed-requires-bubbles", composedRequiresBubblesRule, {
  valid: [
    // allows composed with bubbles
    'new CustomEvent("close", { bubbles: true, composed: true });',
    'new Event("close", { composed: true, bubbles: true });',

    // allows bubbles alone
    'new CustomEvent("close", { bubbles: true });',

    // allows no init object
    'new CustomEvent("close");',
    'new CustomEvent("close", init);',

    // allows a computed bubbles value
    'new CustomEvent("close", { composed: true, bubbles: shouldBubble });',

    // allows a spread it cannot see through
    'new CustomEvent("close", { ...base, composed: true });',
  ],
  invalid: [
    // rejects composed without bubbles
    {
      code: 'new CustomEvent("close", { composed: true });',
      errors: [
        {
          messageId: "composed",
          suggestions: [
            {
              messageId: "addBubbles",
              output: 'new CustomEvent("close", { bubbles: true, composed: true });',
            },
          ],
        },
      ],
    },

    // rejects composed with bubbles false
    {
      code: 'new CustomEvent("close", { composed: true, bubbles: false });',
      errors: [
        {
          messageId: "composed",
          suggestions: [
            {
              messageId: "addBubbles",
              output: 'new CustomEvent("close", { composed: true, bubbles: true });',
            },
          ],
        },
      ],
    },

    // rejects on a plain Event
    {
      code: 'new Event("close", { composed: true, detail: 1 });',
      errors: [
        {
          messageId: "composed",
          suggestions: [
            {
              messageId: "addBubbles",
              output: 'new Event("close", { bubbles: true, composed: true, detail: 1 });',
            },
          ],
        },
      ],
    },

    // highlights the composed option
    {
      code: highlightCode,
      errors: [
        {
          messageId: "composed",
          ...spanOf(highlightCode, "composed: true"),
          suggestions: [
            {
              messageId: "addBubbles",
              output:
                'this.dispatchEvent(new CustomEvent("close", { bubbles: true, composed: true }));',
            },
          ],
        },
      ],
    },
  ],
});
