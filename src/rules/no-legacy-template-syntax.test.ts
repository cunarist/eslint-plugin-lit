import { spanOf, testRule } from "#testing";

import { noLegacyTemplateSyntaxRule } from "./no-legacy-template-syntax.ts";

/** Appended rather than prepended, so the snippet's own offsets stay put. */
const IMPORTS = '\nimport { html } from "lit";';

const highlightCode = `const t = html\`<div>\${this.a} [[name]]</div>\`;${IMPORTS}`;

testRule("no-legacy-template-syntax", noLegacyTemplateSyntaxRule, {
  valid: [
    // allows Lit bindings
    `const t = html\`<div>\${this.name}</div>\`;${IMPORTS}`,
    `const t = html\`<div class=\${this.cls}></div>\`;${IMPORTS}`,
    `const t = html\`<div>[ a ]</div>\`;${IMPORTS}`,
    `const t = html\`<div>{ a }</div>\`;${IMPORTS}`,
    `const t = html\`<div>\${this.a}\${this.b}</div>\`;${IMPORTS}`,

    // ignores non-html templates
    "const t = sql`<div>[[name]]</div>`;",
  ],
  invalid: [
    // rejects Polymer one-way binding
    {
      code: `const t = html\`<div>[[this.name]]</div>\`;${IMPORTS}`,
      errors: [{ messageId: "legacy", data: { kind: "[[…]]" } }],
    },

    // rejects Polymer two-way binding
    {
      code: `const t = html\`<div title={{name}}></div>\`;${IMPORTS}`,
      errors: [{ messageId: "legacy", data: { kind: "{{…}}" } }],
    },

    // highlights the legacy binding after a Lit one
    {
      code: highlightCode,
      errors: [{ messageId: "legacy", ...spanOf(highlightCode, "[[name]]") }],
    },
  ],
});
