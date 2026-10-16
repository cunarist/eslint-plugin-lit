import { spanOf, testRule } from "#testing";

import { noScriptInTemplateRule } from "./no-script-in-template.ts";

/** Appended rather than prepended, so the snippet's own offsets stay put. */
const IMPORTS = '\nimport { html } from "lit";';

const highlightCode = `const t = html\`<script src="x.js"></script>\`;${IMPORTS}`;

const SCRIPT = { messageId: "script" };

testRule("no-script-in-template", noScriptInTemplateRule, {
  valid: [
    // allows templates without scripts
    `const t = html\`<div></div>\`;${IMPORTS}`,
    `const t = html\`<div>\${this.name}</div>\`;${IMPORTS}`,
    `const t = html\`\`;${IMPORTS}`,

    // does not match a mention in text
    `const t = html\`<p>use a script tag</p>\`;${IMPORTS}`,

    // ignores non-html templates
    "const t = sql`<script></script>`;",
  ],
  invalid: [
    // rejects a script element
    { code: `const t = html\`<script></script>\`;${IMPORTS}`, errors: [SCRIPT] },
    { code: `const t = html\`<div><script>go();</script></div>\`;${IMPORTS}`, errors: [SCRIPT] },

    // reports each script
    {
      code: `const t = html\`<script></script><script></script>\`;${IMPORTS}`,
      errors: [SCRIPT, SCRIPT],
    },

    // highlights the start tag
    {
      code: highlightCode,
      errors: [{ ...SCRIPT, ...spanOf(highlightCode, '<script src="x.js">') }],
    },
  ],
});
