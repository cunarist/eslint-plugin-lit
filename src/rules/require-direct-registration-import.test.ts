import { join } from "node:path";

import { vi } from "vite-plus/test";

import { spanOf, testRule, writeProject } from "#testing";

import { requireDirectRegistrationImportRule } from "./require-direct-registration-import.ts";

// Each case builds or checks the project-wide registration index, so the
// first case of each host runs cold; give this file's tests headroom.
vi.setConfig({ testTimeout: 20_000 });

/**
 * A project where `element-a.ts` and `element-b.ts` each register one tag,
 * plus one element behind an `index.ts` barrel and one behind a `mod.ts`.
 */
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
    ["widgets/index.ts", 'export * from "./element-w.ts";\n'],
    [
      "widgets/element-w.ts",
      "export class ElementW extends HTMLElement {}\n" +
        'declare global { interface HTMLElementTagNameMap { "cl-w": ElementW; } }\n',
    ],
    ["legacy/mod.ts", 'export * from "./element-l.ts";\n'],
    [
      "legacy/element-l.ts",
      "export class ElementL extends HTMLElement {}\n" +
        'declare global { interface HTMLElementTagNameMap { "cl-l": ElementL; } }\n',
    ],
  ]),
);

const LIT = 'import { html } from "lit";\n';

/** `bad.ts` uses `<cl-b>` without importing the module that registers it. */
const BAD = `${LIT}\nimport "./element-a.ts";\nexport const view = html\`\n  <cl-a></cl-a>\n  <cl-b></cl-b>\n\`;\n`;

/** `legacy.ts` imports a `mod.ts`, which is not a barrel, so `<cl-l>` is borrowed. */
const LEGACY = `${LIT}\nimport "./legacy/mod.ts";\nexport const view = html\`<cl-l></cl-l>\`;\n`;

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
    // an `index.ts` barrel counts for the elements under its own folder
    {
      code: `${LIT}\nimport "./widgets/index.ts";\nexport const view = html\`<cl-w></cl-w>\`;\n`,
      filename: join(root, "barrel.ts"),
    },
  ],
  invalid: [
    // flags an unimported tag, highlighting its start tag
    {
      code: BAD,
      filename: join(root, "bad.ts"),
      errors: [{ messageId: "unimported", ...spanOf(BAD, "<cl-b>") }],
    },
    // a Deno-style `mod.ts` is not a barrel, so what it re-exports is not followed
    {
      code: LEGACY,
      filename: join(root, "legacy.ts"),
      errors: [{ messageId: "unimported", ...spanOf(LEGACY, "<cl-l>") }],
    },
  ],
});
