import { testRule } from "#testing";

import { noDuplicateContextProviderRule } from "./no-duplicate-context-provider.ts";

const LIT = 'import { LitElement } from "lit";\n';

const DUPLICATE = { messageId: "duplicate" };

const highlightCode = `${LIT}class A extends LitElement {
      @provide({ context: boardContext })
      accessor board = EMPTY_BOARD;
      @provide({ context: boardContext })
      accessor alsoBoard = EMPTY_BOARD;
    }`;

const DECORATOR = "@provide({ context: boardContext })";

/** The second decorator, on line 5: `spanOf` would find the first. */
const secondDecorator = { line: 5, column: 7, endLine: 5, endColumn: 7 + DECORATOR.length };

testRule("no-duplicate-context-provider", noDuplicateContextProviderRule, {
  valid: [
    // allows distinct contexts
    `${LIT}class A extends LitElement {
      @provide({ context: boardContext })
      accessor board = EMPTY_BOARD;
      @provide({ context: dialogContext })
      accessor dialog = EMPTY_DIALOG;
    }`,

    // allows the same context in two classes
    `${LIT}class A extends LitElement {
      @provide({ context: boardContext })
      accessor board = EMPTY_BOARD;
    }
    class B extends LitElement {
      @provide({ context: boardContext })
      accessor board = EMPTY_BOARD;
    }`,

    // allows provide beside consume
    `${LIT}class A extends LitElement {
      @provide({ context: boardContext })
      accessor board = EMPTY_BOARD;
      @consume({ context: boardContext, subscribe: true })
      accessor seen = EMPTY_BOARD;
    }`,
  ],
  invalid: [
    // rejects the same context twice, highlighting the duplicate decorator
    {
      code: highlightCode,
      errors: [{ ...DUPLICATE, data: { context: "boardContext" }, ...secondDecorator }],
    },

    // matches a namespaced context reference
    {
      code: `${LIT}class A extends LitElement {
      @provide({ context: contexts.board })
      accessor board = EMPTY_BOARD;
      @provide({ context: contexts.board })
      accessor alsoBoard = EMPTY_BOARD;
    }`,
      errors: [{ ...DUPLICATE, data: { context: "contexts.board" } }],
    },

    // reports every extra provider
    {
      code: `${LIT}class A extends LitElement {
      @provide({ context: boardContext })
      accessor a = EMPTY_BOARD;
      @provide({ context: boardContext })
      accessor b = EMPTY_BOARD;
      @provide({ context: boardContext })
      accessor c = EMPTY_BOARD;
    }`,
      errors: [DUPLICATE, DUPLICATE],
    },
  ],
});
