import { spanOf, testRule } from "#testing";

import { noPartialPropertyBindingRule } from "./no-partial-property-binding.ts";

/** Appended rather than prepended, so the snippet's own offsets stay put. */
const IMPORTS = '\nimport { html } from "lit";';

const prefixCode = `const t = html\`<x-y .prop="x\${this.a}"></x-y>\`;${IMPORTS}`;

const strayCode = `const t = html\`<x-y .prop=\${this.a} \${this.b}></x-y>\`;${IMPORTS}`;

const PROPERTY = { messageId: "partial", data: { kind: "property" } };

testRule("no-partial-property-binding", noPartialPropertyBindingRule, {
  valid: [
    // allows a whole-value binding
    `const t = html\`<x-y .prop=\${this.a}></x-y>\`;${IMPORTS}`,
    `const t = html\`<x-y .prop="\${this.a}"></x-y>\`;${IMPORTS}`,
    `const t = html\`<x-y @go=\${this.onGo}></x-y>\`;${IMPORTS}`,
    `const t = html\`<x-y ?open=\${this.open}></x-y>\`;${IMPORTS}`,

    // allows a static property literal
    `const t = html\`<x-y .prop="hello"></x-y>\`;${IMPORTS}`,

    // allows composed plain attributes
    `const t = html\`<div class="a \${this.b}"></div>\`;${IMPORTS}`,
    `const t = html\`<div class="\${this.a} \${this.b}"></div>\`;${IMPORTS}`,

    // ignores non-html templates
    'const t = sql`<x-y .prop="x${this.a}"></x-y>`;',
  ],
  invalid: [
    // rejects a literal prefix, highlighting the whole binding
    { code: prefixCode, errors: [{ ...PROPERTY, ...spanOf(prefixCode, '.prop="x${this.a}"') }] },

    // rejects a literal suffix
    { code: `const t = html\`<x-y .prop=\${this.a}px></x-y>\`;${IMPORTS}`, errors: [PROPERTY] },

    // rejects two expressions in one value
    {
      code: `const t = html\`<x-y .prop="\${this.a}\${this.b}"></x-y>\`;${IMPORTS}`,
      errors: [PROPERTY],
    },

    // rejects a trailing unquoted binding, highlighting through it
    {
      code: strayCode,
      errors: [{ ...PROPERTY, ...spanOf(strayCode, ".prop=${this.a} ${this.b}") }],
    },

    // applies to event and boolean bindings
    {
      code: `const t = html\`<x-y @go="x\${this.a}"></x-y>\`;${IMPORTS}`,
      errors: [{ messageId: "partial", data: { kind: "event" } }],
    },
    {
      code: `const t = html\`<x-y ?open="\${this.a}!"></x-y>\`;${IMPORTS}`,
      errors: [{ messageId: "partial", data: { kind: "boolean" } }],
    },
  ],
});
