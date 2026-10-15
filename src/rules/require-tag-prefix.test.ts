import { spanOf, testRule } from "#testing";

import { requireTagPrefixRule } from "./require-tag-prefix.ts";

/** The Lit imports the snippets use, so detection resolves them. */
const LIT = `import { LitElement } from "lit";
import { customElement } from "lit/decorators.js";
`;

const bare = `${LIT}@customElement("path-bar")\nclass PathBar extends LitElement {}`;

testRule("require-tag-prefix", requireTagPrefixRule, {
  valid: [
    // accepts a prefixed tag
    `${LIT}@customElement("cl-path-bar")\nclass PathBar extends LitElement {}`,
    `${LIT}@customElement("cl-md-slash-menu")\nclass SlashMenu extends LitElement {}`,

    // accepts an Element-suffixed class
    `${LIT}@customElement("cl-path-bar")\nclass PathBarElement extends LitElement {}`,
  ],
  invalid: [
    // rejects a bare tag, highlighting the tag
    {
      code: bare,
      errors: [{ messageId: "noPrefix", data: { tag: "path-bar" }, ...spanOf(bare, '"path-bar"') }],
    },
  ],
});
