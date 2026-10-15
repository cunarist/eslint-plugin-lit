import { spanOf, testRule } from "#testing";

import { requireElementSuffixRule } from "./require-element-suffix.ts";

/** The Lit imports the snippets use, so detection resolves them. */
const LIT = `import { LitElement } from "lit";
import { customElement } from "lit/decorators.js";
`;

const bare = `${LIT}@customElement("cl-path-bar")\nclass PathBar extends LitElement {}`;

testRule("require-element-suffix", requireElementSuffixRule, {
  valid: [
    // accepts the suffix
    `${LIT}@customElement("cl-path-bar")\nclass PathBarElement extends LitElement {}`,

    // ignores unregistered classes: a base class is not an element until
    // something registers it
    `${LIT}class PathBar extends LitElement {}`,
  ],
  invalid: [
    // rejects a bare name, highlighting the class name
    {
      code: bare,
      errors: [{ messageId: "suffix", data: { name: "PathBar" }, ...spanOf(bare, "PathBar") }],
    },
  ],
});
