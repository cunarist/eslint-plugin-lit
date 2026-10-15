import { spanOf, testRule } from "#testing";

import { valueAfterConstraintsRule } from "./value-after-constraints.ts";

const LIT = 'import { html } from "lit";\n';

/** An expected report of `value` set before `constraint`. */
function early(
  value: string,
  constraint: string,
): { messageId: string; data: Record<string, string> } {
  return { messageId: "early", data: { value, constraint } };
}

const minCode = `${LIT}const t = html\`<input .value=\${this.v} min="1">\`;`;

testRule("value-after-constraints", valueAfterConstraintsRule, {
  valid: [
    // allows value last
    `${LIT}const t = html\`<input min="1" .value=\${this.v}>\`;`,
    `${LIT}const t = html\`<input type="number" min="1" max="9" value="5">\`;`,
    `${LIT}const t = html\`<input .value=\${this.v}>\`;`,
    `${LIT}const t = html\`<input min="1" max="9">\`;`,
    // ignores non-form elements
    `${LIT}const t = html\`<x-y value="5" max="9"></x-y>\`;`,
    // ignores non-html templates
    'const t = sql`<input .value=${this.v} min="1">`;',
  ],
  invalid: [
    // rejects value before a constraint, highlighting the value binding
    {
      code: minCode,
      errors: [{ ...early(".value", "min"), ...spanOf(minCode, ".value=${this.v}") }],
    },
    {
      code: `${LIT}const t = html\`<input value="5" pattern="\\\\d+">\`;`,
      errors: [early("value", "pattern")],
    },
    {
      code: `${LIT}const t = html\`<textarea .value=\${this.v} maxlength="9"></textarea>\`;`,
      errors: [early(".value", "maxlength")],
    },
    // reports once per element
    {
      code: `${LIT}const t = html\`<input .value=\${this.v} min="1" max="9">\`;`,
      errors: [early(".value", "min")],
    },
  ],
});
