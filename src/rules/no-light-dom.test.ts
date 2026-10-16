import { spanOf, testRule } from "#testing";

import { noLightDomRule } from "./no-light-dom.ts";

const IMPORT = 'import { LitElement } from "lit";\n';

const thisCode = `${IMPORT}class El extends LitElement { createRenderRoot() { return this; } }`;

testRule("no-light-dom", noLightDomRule, {
  valid: [
    // allows other createRenderRoot bodies: tweaking the shadow root options
    // keeps the shadow root
    `${IMPORT}class El extends LitElement {
      createRenderRoot() { return super.createRenderRoot(); }
    }`,

    // ignores non-Lit classes
    "class Plain { createRenderRoot() { return this; } }",
  ],
  invalid: [
    // rejects returning this, highlighting the override
    {
      code: thisCode,
      errors: [
        { messageId: "lightDom", ...spanOf(thisCode, "createRenderRoot() { return this; }") },
      ],
    },
  ],
});
