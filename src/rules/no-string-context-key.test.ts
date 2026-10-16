import { spanOf, testRule } from "#testing";

import { noStringContextKeyRule } from "./no-string-context-key.ts";

const IMPORT = [
  'import { createContext } from "@lit/context";',
  'import * as context from "@lit/context";',
  "",
].join("\n");

/** The expected report for `key`, whose suggestion leaves `output`. */
function stringKey(
  key: string,
  output: string,
): {
  messageId: string;
  data: { key: string };
  suggestions: { messageId: string; output: string }[];
} {
  return {
    messageId: "stringKey",
    data: { key },
    suggestions: [{ messageId: "useSymbol", output }],
  };
}

const boardCode = `${IMPORT}const boardContext = createContext<BoardContext>("board");`;

testRule("no-string-context-key", noStringContextKeyRule, {
  valid: [
    // allows a symbol key
    `${IMPORT}const boardContext = createContext<BoardContext>(Symbol("board"));`,
    `${IMPORT}const c = createContext<Theme>(Symbol());`,

    // allows a referenced key
    `${IMPORT}const c = createContext<Theme>(BOARD_KEY);`,

    // ignores unrelated calls
    `${IMPORT}const c = createThing("board");`,
  ],
  invalid: [
    // rejects a string key, highlighting the key literal
    {
      code: boardCode,
      errors: [
        {
          ...stringKey("board", boardCode.replace('("board")', '(Symbol("board"))')),
          ...spanOf(boardCode, '"board"'),
        },
      ],
    },

    // rejects a namespaced string key
    {
      code: `${IMPORT}const c = context.createContext<Theme>("theme");`,
      errors: [
        stringKey("theme", `${IMPORT}const c = context.createContext<Theme>(Symbol("theme"));`),
      ],
    },

    // reports each string key
    {
      code: `${IMPORT}const a = createContext<A>("a");\nconst b = createContext<B>("b");`,
      errors: [
        stringKey(
          "a",
          `${IMPORT}const a = createContext<A>(Symbol("a"));\nconst b = createContext<B>("b");`,
        ),
        stringKey(
          "b",
          `${IMPORT}const a = createContext<A>("a");\nconst b = createContext<B>(Symbol("b"));`,
        ),
      ],
    },
  ],
});
