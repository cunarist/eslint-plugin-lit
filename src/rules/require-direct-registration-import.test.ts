import { join } from "node:path";

import { spanOf, testRule, writeProject } from "#testing";

import { requireDirectRegistrationImportRule } from "./require-direct-registration-import.ts";

/** A project where `element-a.ts` and `element-b.ts` each register one tag. */
const root = writeProject(
  new Map([
    ["tsconfig.json", "{}\n"],
    ["package.json", '{ "type": "module" }\n'],
    [
      "element-a.ts",
      "export class ElementA extends HTMLElement {}\n" +
        'declare global { interface HTMLElementTagNameMap { "cl-a": ElementA; } }\n',
    ],
    [
      "element-b.ts",
      "export class ElementB extends HTMLElement {}\n" +
        'declare global { interface HTMLElementTagNameMap { "cl-b": ElementB; } }\n',
    ],
  ]),
);

const LIT = 'import { html } from "lit";\n';

/** `bad.ts` uses `<cl-b>` without importing the module that registers it. */
const BAD = `${LIT}\nimport "./element-a.ts";\nexport const view = html\`\n  <cl-a></cl-a>\n  <cl-b></cl-b>\n\`;\n`;

testRule("require-direct-registration-import", requireDirectRegistrationImportRule, {
  valid: [
    // passes when every registering module is imported
    {
      code: `${LIT}\nimport "./element-a.ts";\nimport "./element-b.ts";\nexport const view = html\`\n  <cl-a></cl-a>\n  <cl-b></cl-b>\n\`;\n`,
      filename: join(root, "good.ts"),
    },
    // a tag registered in the file itself, or nowhere the index sees, passes
    {
      code: `${LIT}export class ElementC extends HTMLElement {}\ndeclare global { interface HTMLElementTagNameMap { "cl-c": ElementC; } }\nexport const view = html\`<cl-c></cl-c><cl-z></cl-z>\`;\n`,
      filename: join(root, "self.ts"),
    },
  ],
  invalid: [
    // flags an unimported tag, highlighting its start tag
    {
      code: BAD,
      filename: join(root, "bad.ts"),
      errors: [{ messageId: "unimported", ...spanOf(BAD, "<cl-b>") }],
    },
  ],
});
