import { spanOf, testRule } from "#testing";

import { directiveAllowlistRule } from "./directive-allowlist.ts";

/** The expected report for an import of `source`. */
function disallowed(source: string): { messageId: string; data: { source: string } } {
  return { messageId: "disallowed", data: { source } };
}

const whenCode = 'import { when } from "lit/directives/when.js";';

testRule("directive-allowlist", directiveAllowlistRule, {
  valid: [
    // allows ref and repeat
    'import { ref } from "lit/directives/ref.js";',
    'import { repeat } from "lit/directives/repeat.js";',

    // ignores non-directive imports
    'import { html, css, LitElement } from "lit";',
    'import { customElement } from "lit/decorators.js";',
    'import { classMap } from "./directives/class-map.ts";',
  ],
  invalid: [
    // rejects other lit directives
    ...[
      "lit/directives/class-map.js",
      "lit/directives/style-map.js",
      "lit/directives/when.js",
      "lit/directives/unsafe-html.js",
      "lit/directives/live.js",
    ].map((source) => ({
      code: `import { x } from "${source}";`,
      errors: [disallowed(source)],
    })),

    // rejects legacy directive paths
    {
      code: 'import { ref } from "lit-html/directives/ref.js";',
      errors: [disallowed("lit-html/directives/ref.js")],
    },

    // highlights the module specifier
    {
      code: whenCode,
      errors: [
        {
          ...disallowed("lit/directives/when.js"),
          ...spanOf(whenCode, '"lit/directives/when.js"'),
        },
      ],
    },
  ],
});
