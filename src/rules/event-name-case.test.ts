import { spanOf, testRule } from "#testing";

import { eventNameCaseRule } from "./event-name-case.ts";

const highlighted = 'this.dispatchEvent(new CustomEvent("itemSelected"));';

testRule("event-name-case", eventNameCaseRule, {
  valid: [
    // allows lowercase names
    'new CustomEvent("itemselected");',
    'new CustomEvent("item-selected");',
    'new Event("close");',
    'new CustomEvent("cl:item-selected");',

    // allows a computed name
    "new CustomEvent(name);",

    // allows the platform's mixed-case name
    'new Event("DOMContentLoaded");',

    // ignores other constructors
    'new Thing("itemSelected");',
  ],
  invalid: [
    // rejects a camelCase CustomEvent name, suggesting a dashed lowercase name
    {
      code: 'new CustomEvent("itemSelected");',
      errors: [
        {
          messageId: "notKebab",
          data: { name: "itemSelected" },
          suggestions: [
            {
              messageId: "useKebab",
              data: { kebab: "item-selected" },
              output: 'new CustomEvent("item-selected");',
            },
          ],
        },
      ],
    },

    // rejects a camelCase Event name
    {
      code: "new Event('itemSelected');",
      errors: [
        {
          messageId: "notKebab",
          suggestions: [{ messageId: "useKebab", output: "new Event('item-selected');" }],
        },
      ],
    },

    // rejects a PascalCase name
    {
      code: 'new CustomEvent("ItemSelected", { bubbles: true });',
      errors: [
        {
          messageId: "notKebab",
          suggestions: [
            {
              messageId: "useKebab",
              data: { kebab: "item-selected" },
              output: 'new CustomEvent("item-selected", { bubbles: true });',
            },
          ],
        },
      ],
    },

    // rejects a snake_case name
    {
      code: 'new CustomEvent("item_selected");',
      errors: [
        {
          messageId: "notKebab",
          suggestions: [
            {
              messageId: "useKebab",
              data: { kebab: "item-selected" },
              output: 'new CustomEvent("item-selected");',
            },
          ],
        },
      ],
    },

    // highlights the name literal
    {
      code: highlighted,
      errors: [
        {
          messageId: "notKebab",
          ...spanOf(highlighted, '"itemSelected"'),
          suggestions: [
            {
              messageId: "useKebab",
              output: 'this.dispatchEvent(new CustomEvent("item-selected"));',
            },
          ],
        },
      ],
    },
  ],
});
