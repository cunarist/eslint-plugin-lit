import { spanOf, testRule } from "#testing";

import { noQueryDecoratorsRule } from "./no-query-decorators.ts";

/** The Lit base the snippets extend, imported so detection resolves it. */
const LIT = 'import { LitElement } from "lit";\n';

const highlightedDecorator = `${LIT}class A extends LitElement { @query('input') input; }`;

testRule("no-query-decorators", noQueryDecoratorsRule, {
  valid: [
    // allows the other lit decorators
    `${LIT}import { customElement, property, state } from "lit/decorators.js";
     class A extends LitElement { @property() name = ""; @state() open = false; }`,

    // allows the ref directive
    'import { ref } from "lit/directives/ref.js";',

    // allows a same-named import elsewhere
    'import { query } from "./db.ts";',

    // ignores decorators on non-Lit classes
    "class A { @query('input') input; }",
  ],
  invalid: [
    // rejects each query decorator import, highlighting the specifier
    ...["query", "queryAll", "queryAsync", "queryAssignedElements", "queryAssignedNodes"].map(
      (name) => {
        const code = `import { ${name} } from "lit/decorators.js";`;
        return { code, errors: [{ messageId: "import", data: { name }, ...spanOf(code, name) }] };
      },
    ),

    // rejects the decorator on a field, highlighting the decorator
    {
      code: highlightedDecorator,
      errors: [
        {
          messageId: "decorator",
          data: { name: "query" },
          ...spanOf(highlightedDecorator, "@query('input')"),
        },
      ],
    },

    // rejects the decorator on a getter
    {
      code: `${LIT}class A extends LitElement { @queryAll('li') get items() { return []; } }`,
      errors: [{ messageId: "decorator", data: { name: "queryAll" } }],
    },

    // reports import and usage together
    {
      code: `${LIT}import { query } from "lit/decorators.js";
     class A extends LitElement { @query('input') input; }`,
      errors: [{ messageId: "import" }, { messageId: "decorator" }],
    },
  ],
});
