import { spanOf, testRule } from "#testing";

import { requireDashedTagRule } from "./require-dashed-tag.ts";

const LIT =
  'import { LitElement } from "lit";\nimport { customElement } from "lit/decorators.js";\n';

/** An expected report on `tag`, rejected for `reason`. */
function invalid(tag: string, reason: string): { messageId: string; data: Record<string, string> } {
  return { messageId: "invalid", data: { tag, reason } };
}

const noHyphenCode = `${LIT}@customElement("editor")\nclass Editor extends LitElement {}`;

testRule("require-dashed-tag", requireDashedTagRule, {
  valid: [
    // accepts a hyphenated lowercase name
    `${LIT}@customElement("cl-path-bar")\nclass PathBar extends LitElement {}`,
    // ignores a component that registers no tag
    `${LIT}class Editor extends LitElement {}`,
  ],
  invalid: [
    // rejects a name with no hyphen, highlighting the tag literal
    {
      code: noHyphenCode,
      errors: [{ ...invalid("editor", "contains no hyphen"), ...spanOf(noHyphenCode, '"editor"') }],
    },
    // rejects uppercase
    {
      code: `${LIT}@customElement("my-Editor")\nclass Editor extends LitElement {}`,
      errors: [invalid("my-Editor", "contains an uppercase letter")],
    },
    // rejects a leading non-letter
    {
      code: `${LIT}@customElement("-editor")\nclass Editor extends LitElement {}`,
      errors: [invalid("-editor", "does not start with a lowercase letter")],
    },
    // rejects a spec-reserved name
    {
      code: `${LIT}@customElement("font-face")\nclass FontFace extends LitElement {}`,
      errors: [invalid("font-face", "is reserved by the HTML spec")],
    },
  ],
});
