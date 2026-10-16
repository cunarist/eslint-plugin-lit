import { spanOf, testRule } from "#testing";

import { noUnsafeHtmlRule } from "./no-unsafe-html.ts";

/** An expected import report. */
function imported(name: string): { messageId: string; data: { name: string } } {
  return { messageId: "imported", data: { name } };
}

/** An expected call report. */
function call(name: string): { messageId: string; data: { name: string } } {
  return { messageId: "call", data: { name } };
}

const spanCode =
  'import { unsafeHTML } from "lit/directives/unsafe-html.js";\nconst a = unsafeHTML(x);';

testRule("no-unsafe-html", noUnsafeHtmlRule, {
  valid: [
    // allows other directive imports
    'import { ref } from "lit/directives/ref.js";',
    'import { html, LitElement } from "lit";',
    // allows `unsafeHTML` from an unrelated module
    'import { unsafeHTML } from "./local.ts";\nconst a = unsafeHTML(x);',
  ],
  invalid: [
    // rejects the imports
    {
      code: 'import { unsafeHTML } from "lit/directives/unsafe-html.js";',
      errors: [imported("unsafeHTML")],
    },
    {
      code: 'import { unsafeSVG } from "lit/directives/unsafe-svg.js";',
      errors: [imported("unsafeSVG")],
    },
    {
      code: 'import { unsafeHTML } from "lit-html/directives/unsafe-html.js";',
      errors: [imported("unsafeHTML")],
    },
    // rejects the import and every call site
    {
      code: 'import { unsafeHTML } from "lit/directives/unsafe-html.js";\nconst a = unsafeHTML(x);\nconst b = unsafeHTML(y);',
      errors: [imported("unsafeHTML"), call("unsafeHTML"), call("unsafeHTML")],
    },
    // follows a renamed import
    {
      code: 'import { unsafeSVG as raw } from "lit/directives/unsafe-svg.js";\nconst a = raw(x);',
      errors: [imported("unsafeSVG"), call("unsafeSVG")],
    },
    // highlights the specifier and the call
    {
      code: spanCode,
      errors: [
        { ...imported("unsafeHTML"), ...spanOf(spanCode, "unsafeHTML") },
        { ...call("unsafeHTML"), ...spanOf(spanCode, "unsafeHTML(x)") },
      ],
    },
  ],
});
