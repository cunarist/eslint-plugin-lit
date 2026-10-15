import { spanOf, testRule } from "#testing";

import { tagMatchesClassNameRule } from "./tag-matches-class-name.ts";

/** The Lit imports the snippets use, so detection resolves them. */
const LIT = `import { LitElement } from "lit";
import { customElement } from "lit/decorators.js";
`;

const otherClass = `${LIT}@customElement("cl-path-bar") export class Sidebar extends LitElement {}`;

testRule("tag-matches-class-name", tagMatchesClassNameRule, {
  valid: [
    // allows a prefixed tag naming its class
    `${LIT}@customElement("cl-path-bar") export class PathBar extends LitElement {}`,
    `${LIT}@customElement("cl-md-slash-menu") export class SlashMenu extends LitElement {}`,

    // allows a tag with no prefix
    `${LIT}@customElement("path-bar") export class PathBar extends LitElement {}`,

    // ignores an unregistered component
    `${LIT}export class PathBar extends LitElement {}`,
  ],
  invalid: [
    // rejects a tag naming another class, highlighting the registered tag
    {
      code: otherClass,
      errors: [
        {
          messageId: "mismatch",
          data: { tag: "cl-path-bar", className: "Sidebar" },
          ...spanOf(otherClass, '"cl-path-bar"'),
        },
      ],
    },

    // rejects a partial match
    {
      code: `${LIT}@customElement("cl-path") export class PathBar extends LitElement {}`,
      errors: [{ messageId: "mismatch", data: { tag: "cl-path", className: "PathBar" } }],
    },

    // rejects a prefix-only match
    {
      code: `${LIT}@customElement("cl-path-bar-extra") export class PathBar extends LitElement {}`,
      errors: [{ messageId: "mismatch", data: { tag: "cl-path-bar-extra", className: "PathBar" } }],
    },
  ],
});
