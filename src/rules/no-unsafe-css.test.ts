import { spanOf, testRule } from "#testing";

import { noUnsafeCssRule } from "./no-unsafe-css.ts";

const IMPORTED = { messageId: "imported" };
const CALL = { messageId: "call" };

const spanCode = 'import { unsafeCSS } from "lit";\nconst a = unsafeCSS(x);';

testRule("no-unsafe-css", noUnsafeCssRule, {
  valid: [
    // allows other Lit imports
    'import { css, html, LitElement } from "lit";',
    'import { unsafeHTML } from "lit/directives/unsafe-html.js";',
    // allows `unsafeCSS` from an unrelated module
    'import { unsafeCSS } from "./local.ts";\nconst s = unsafeCSS(x);',
  ],
  invalid: [
    // rejects the import from each Lit package
    { code: 'import { unsafeCSS } from "lit";', errors: [IMPORTED] },
    { code: 'import { unsafeCSS } from "lit-element";', errors: [IMPORTED] },
    { code: 'import { unsafeCSS } from "lit-html";', errors: [IMPORTED] },
    // rejects the import and every call site
    {
      code: 'import { css, unsafeCSS } from "lit";\nconst a = unsafeCSS(x);\nconst b = unsafeCSS(y);',
      errors: [IMPORTED, CALL, CALL],
    },
    // follows a renamed import
    {
      code: 'import { unsafeCSS as raw } from "lit";\nconst a = raw(x);',
      errors: [IMPORTED, CALL],
    },
    // highlights the specifier and the call
    {
      code: spanCode,
      errors: [
        { ...IMPORTED, ...spanOf(spanCode, "unsafeCSS") },
        { ...CALL, ...spanOf(spanCode, "unsafeCSS(x)") },
      ],
    },
  ],
});
