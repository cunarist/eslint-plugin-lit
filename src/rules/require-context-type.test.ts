import { spanOf, testRule } from "#testing";

import { requireContextTypeRule } from "./require-context-type.ts";

const IMPORT =
  'import { createContext } from "@lit/context";\nimport * as context from "@lit/context";\n';

const UNTYPED = { messageId: "untyped" };

const untypedCode = `${IMPORT}const c = createContext(Symbol('board'));`;
const namespacedCode = `${IMPORT}const c = context.createContext(Symbol('board'));`;

testRule("require-context-type", requireContextTypeRule, {
  valid: [
    // allows a typed context
    `${IMPORT}export const boardContext = createContext<BoardContext>("board");`,
    `${IMPORT}export const themeContext = createContext<Theme>(Symbol('theme'));`,
    // allows a namespaced typed call
    `${IMPORT}const c = context.createContext<BoardContext>(Symbol('board'));`,
    // ignores unrelated calls
    `${IMPORT}const c = createThing(Symbol('board'));`,
    `${IMPORT}const c = makeContext(Symbol('board'));`,
  ],
  invalid: [
    // rejects an untyped context, highlighting the callee
    // (the callee on line 3, not the import's `createContext`)
    {
      code: untypedCode,
      errors: [{ ...UNTYPED, line: 3, column: 11, endLine: 3, endColumn: 24 }],
    },
    // rejects an untyped namespaced call
    {
      code: namespacedCode,
      errors: [{ ...UNTYPED, ...spanOf(namespacedCode, "context.createContext") }],
    },
    // rejects an untyped no-argument call
    { code: `${IMPORT}const c = createContext();`, errors: [UNTYPED] },
  ],
});
