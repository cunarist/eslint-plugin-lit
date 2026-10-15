import { spanOf, testRule } from "#testing";

import { noClassfieldShadowingRule } from "./no-classfield-shadowing.ts";

const LIT =
  'import { LitElement } from "lit";\nimport { property, state } from "lit/decorators.js";\n';

const SHADOWING = { messageId: "shadowing", suggestions: [] };

const highlightCode = `${LIT}class Base extends LitElement {
  @property() name = "";
}
class El extends Base {
  name = "x";
}`;

const typedCode = `${LIT}class Base extends LitElement {
  @property() name = "";
}
class El extends Base {
  readonly name: string;
}`;

testRule("no-classfield-shadowing", noClassfieldShadowingRule, {
  valid: [
    // allows unrelated fields
    `${LIT}class Base extends LitElement {
      @property() name = "";
    }
    class El extends Base {
      other = 1;
    }`,

    // allows a declare redeclaration
    `${LIT}class Base extends LitElement {
      @property() name = "";
    }
    class El extends Base {
      declare name: string;
    }`,

    // ignores classes outside a Lit chain
    `${LIT}class Base {
      @property() name = "";
    }
    class El extends Base {
      name = "x";
    }`,
  ],
  invalid: [
    // rejects shadowing an inherited property, highlighting the field name
    {
      code: highlightCode,
      errors: [
        {
          ...SHADOWING,
          data: { name: "name" },
          ...spanOf(highlightCode, 'name = "x"'),
          endColumn: spanOf(highlightCode, 'name = "x"').column + "name".length,
        },
      ],
    },

    // rejects shadowing through an exported base
    {
      code: `${LIT}export class Base extends LitElement {
      @state() open = false;
    }
    export class El extends Base {
      open = true;
    }`,
      errors: [SHADOWING],
    },

    // rejects shadowing across two levels
    {
      code: `${LIT}class Base extends LitElement {
      @property() name = "";
    }
    class Middle extends Base {}
    class El extends Middle {
      name = "x";
    }`,
      errors: [SHADOWING],
    },

    // rejects shadowing static properties on the same class
    {
      code: `${LIT}class El extends LitElement {
      static properties = { name: { type: String } };
      name = "x";
    }`,
      errors: [SHADOWING],
    },

    // suggests `declare` for a field with no value
    {
      code: typedCode,
      errors: [
        {
          messageId: "shadowing",
          suggestions: [
            {
              messageId: "declare",
              output: typedCode.replace("readonly name", "declare readonly name"),
            },
          ],
        },
      ],
    },
  ],
});
