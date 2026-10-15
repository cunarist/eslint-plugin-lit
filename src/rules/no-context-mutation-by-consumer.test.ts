import { spanOf, testRule } from "#testing";

import { noContextMutationByConsumerRule } from "./no-context-mutation-by-consumer.ts";

const LIT = 'import { LitElement } from "lit";\n';

const MUTATION = { messageId: "mutation" };

const highlightCode = `${LIT}class A extends LitElement {
      @consume({ context: themeContext })
      accessor #theme = EMPTY_THEME;
      go() { this.#theme = next; }
    }`;

testRule("no-context-mutation-by-consumer", noContextMutationByConsumerRule, {
  valid: [
    // allows reading a consumed field
    `${LIT}class A extends LitElement {
      @consume({ context: themeContext, subscribe: true })
      accessor theme = EMPTY_THEME;
      render() { return this.theme.name; }
    }`,

    // allows writing a provided field
    `${LIT}class A extends LitElement {
      @provide({ context: boardContext })
      accessor board = EMPTY_BOARD;
      go() { this.board = next; }
    }`,

    // allows writing an ordinary field
    `${LIT}class A extends LitElement {
      @consume({ context: themeContext })
      accessor theme = EMPTY_THEME;
      accessor other = 0;
      go() { this.other = 1; }
    }`,
  ],
  invalid: [
    // rejects assigning a consumed field
    {
      code: `${LIT}class A extends LitElement {
      @consume({ context: themeContext })
      accessor theme = EMPTY_THEME;
      go() { this.theme = next; }
    }`,
      errors: [{ ...MUTATION, data: { path: "this.theme" } }],
    },

    // rejects a private consumed field, highlighting the assignment target
    {
      code: highlightCode,
      errors: [
        { ...MUTATION, data: { path: "this.#theme" }, ...spanOf(highlightCode, "this.#theme") },
      ],
    },

    // rejects a plain property field
    {
      code: `${LIT}class A extends LitElement {
      @consume({ context: themeContext })
      theme = EMPTY_THEME;
      go() { this.theme = next; }
    }`,
      errors: [MUTATION],
    },

    // rejects compound and update writes
    {
      code: `${LIT}class A extends LitElement {
      @consume({ context: countContext })
      accessor count = 0;
      go() { this.count += 1; this.count++; }
    }`,
      errors: [MUTATION, MUTATION],
    },
  ],
});
