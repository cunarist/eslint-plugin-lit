import { spanOf, testRule } from "#testing";

import { noLegacyImportsRule } from "./no-legacy-imports.ts";

const pathCode = 'import { html } from "lit-html";';

const nameCode = 'import { internalProperty } from "lit";';

testRule("no-legacy-imports", noLegacyImportsRule, {
  valid: [
    // allows modern lit imports
    'import { LitElement, html, css } from "lit";',
    'import { property, state } from "lit/decorators.js";',
    'import { repeat } from "lit/directives/repeat.js";',

    // ignores unrelated packages
    'import { html } from "preact";',
    'import { internalProperty } from "./local.ts";',
  ],
  invalid: [
    // rejects lit-element
    {
      code: 'import { LitElement } from "lit-element";',
      errors: [
        {
          messageId: "legacyPath",
          data: { source: "lit-element" },
          suggestions: [{ messageId: "useLit", output: 'import { LitElement } from "lit";' }],
        },
      ],
    },

    // rejects lit-html, highlighting the module specifier
    {
      code: pathCode,
      errors: [
        {
          messageId: "legacyPath",
          data: { source: "lit-html" },
          ...spanOf(pathCode, '"lit-html"'),
          suggestions: [{ messageId: "useLit", output: 'import { html } from "lit";' }],
        },
      ],
    },

    // rejects legacy subpaths, which may have moved, with no suggestion
    {
      code: 'import { repeat } from "lit-html/directives/repeat.js";',
      errors: [
        {
          messageId: "legacyPath",
          data: { source: "lit-html/directives/repeat.js" },
          suggestions: [],
        },
      ],
    },

    // rejects renamed exports from lit, highlighting the export
    {
      code: 'import { UpdatingElement } from "lit";',
      errors: [
        {
          messageId: "legacyName",
          data: { name: "UpdatingElement", replacement: "ReactiveElement" },
          suggestions: [
            {
              messageId: "useReplacement",
              data: { replacement: "ReactiveElement" },
              output: 'import { ReactiveElement as UpdatingElement } from "lit";',
            },
          ],
        },
      ],
    },
    {
      code: nameCode,
      errors: [
        {
          messageId: "legacyName",
          data: { name: "internalProperty", replacement: "state" },
          ...spanOf(nameCode, "internalProperty"),
          suggestions: [
            {
              messageId: "useReplacement",
              data: { replacement: "state" },
              output: 'import { state as internalProperty } from "lit";',
            },
          ],
        },
      ],
    },

    // keeps an alias the import already has
    {
      code: 'import { internalProperty as reactive } from "lit";',
      errors: [
        {
          messageId: "legacyName",
          suggestions: [
            {
              messageId: "useReplacement",
              data: { replacement: "state" },
              output: 'import { state as reactive } from "lit";',
            },
          ],
        },
      ],
    },

    // reports name and path separately, in source order
    {
      code: 'import { UpdatingElement } from "lit-element";',
      errors: [
        {
          messageId: "legacyName",
          suggestions: [
            {
              messageId: "useReplacement",
              data: { replacement: "ReactiveElement" },
              output: 'import { ReactiveElement as UpdatingElement } from "lit-element";',
            },
          ],
        },
        {
          messageId: "legacyPath",
          suggestions: [{ messageId: "useLit", output: 'import { UpdatingElement } from "lit";' }],
        },
      ],
    },
  ],
});
