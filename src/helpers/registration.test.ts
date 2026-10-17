import type { TSESTree } from "@typescript-eslint/types";
import { dirname, join, relative } from "node:path";
import { vi } from "vite-plus/test";

import type { ExpectedError } from "#testing";
import { spanOf, testRule, writeProject } from "#testing";

import { isHtmlTemplate, lintedRealPath, runtimeImports, tagRegistrations } from "./lit.ts";
import type { LitRule } from "./rule.ts";
import { parseTemplate, rangeLoc, templateSource, walkElements } from "./template.ts";

// Cases here build a written project's registration index, so the first case
// of each host runs cold; give this file's tests headroom.
vi.setConfig({ testTimeout: 20_000 });

/**
 * A rule that reports, for each custom element in an `html` template, where
 * its tag is registered and whether this file runs that module, so the
 * lookups run under both hosts.
 */
const probeRule: LitRule = {
  meta: {
    type: "problem",
    docs: { description: "Report what the registration helpers find" },
    schema: [],
    messages: {
      element: "<{{tag}}> is registered in {{file}}, imported: {{imported}}.",
    },
  },
  create(context) {
    return {
      TaggedTemplateExpression(node: TSESTree.TaggedTemplateExpression): void {
        if (!isHtmlTemplate(node, context)) {
          return;
        }
        const self = lintedRealPath(context);
        const source = templateSource(node);
        walkElements(parseTemplate(source.text), (parsed) => {
          const span = parsed.sourceCodeLocation?.startTag;
          if (!parsed.tagName.includes("-") || span === undefined) {
            return;
          }
          const file = tagRegistrations(context).get(parsed.tagName);
          const imported =
            file !== undefined && (file === self || runtimeImports(context).has(file));
          context.report({
            loc: rangeLoc(
              context.sourceCode,
              source.toSourceRange(span.startOffset, span.endOffset),
            ),
            messageId: "element",
            data: {
              tag: parsed.tagName,
              file: file === undefined ? "nowhere" : relative(dirname(self), file),
              imported: imported ? "yes" : "no",
            },
          });
        });
      },
    };
  },
};

/** An expected element report. */
function element(tag: string, file: string, imported: string): ExpectedError {
  return { messageId: "element", data: { tag, file, imported } };
}

/** Files that each register one tag in their own way. */
const PROJECT: Map<string, string> = new Map([
  ["tsconfig.json", "{}\n"],
  ["package.json", `{ "type": "module", "imports": { "#outside": "./element-a.ts" } }\n`],
  // Registration by augmentation, by `customElements.define`, and by decorator.
  [
    "element-a.ts",
    `export class ElementA extends HTMLElement {}\n` +
      `declare global { interface HTMLElementTagNameMap { "cl-a": ElementA; } }\n`,
  ],
  [
    "element-b.ts",
    `export class ElementB extends HTMLElement {}\n` +
      `declare global { interface HTMLElementTagNameMap { "cl-b": ElementB; } }\n`,
  ],
  [
    "element-c.ts",
    `export class ElementC extends HTMLElement {}\ncustomElements.define("cl-c", ElementC);\n`,
  ],
  [
    "element-d.ts",
    `export class ElementD extends HTMLElement {}\n` +
      `declare global { interface HTMLElementTagNameMap { "cl-d": ElementD; } }\n`,
  ],
  [
    "element-h.ts",
    `import { LitElement } from "lit";\n` +
      `import { customElement as register } from "lit/decorators.js";\n` +
      `@register("cl-h")\nexport class ElementH extends LitElement {}\n`,
  ],
  // A file importing a barrel that is not `index.ts`, which is not followed.
  ["register-elements.ts", `import "./registration-entry.ts";\n`],
  ["registration-entry.ts", `import "./register-elements.ts";\nexport * from "./element-b.ts";\n`],
  // An `index.ts` barrel, followed only inside its own folder.
  [
    "widgets/index.ts",
    `import "#outside";\nimport "./nested/index.ts";\n` +
      `export * from "./element-e.ts";\nexport type { ElementG } from "./element-g.ts";\n`,
  ],
  [
    "widgets/element-e.ts",
    `export class ElementE extends HTMLElement {}\n` +
      `declare global { interface HTMLElementTagNameMap { "cl-e": ElementE; } }\n`,
  ],
  [
    "widgets/element-g.ts",
    `export class ElementG extends HTMLElement {}\n` +
      `declare global { interface HTMLElementTagNameMap { "cl-g": ElementG; } }\n`,
  ],
  ["widgets/nested/index.ts", `export * from "./element-f.ts";\n`],
  // A Deno-style `mod.ts` barrel, which is not followed.
  ["legacy/mod.ts", `export * from "./element-i.ts";\n`],
  [
    "legacy/element-i.ts",
    `export class ElementI extends HTMLElement {}\n` +
      `declare global { interface HTMLElementTagNameMap { "cl-i": ElementI; } }\n`,
  ],
  [
    "widgets/nested/element-f.ts",
    `export class ElementF extends HTMLElement {}\n` +
      `declare global { interface HTMLElementTagNameMap { "cl-f": ElementF; } }\n`,
  ],
  // Names spelled like the registration means, but local to the file.
  [
    "shadowed.ts",
    `export {};\n` +
      `const customElements = { define(_tag: string, _element: unknown): void {} };\n` +
      `class LocalElement {}\ncustomElements.define("cl-shadowed-registry", LocalElement);\n` +
      `const customElement = (_tag: string) => (_element: unknown): void => {};\n` +
      `@customElement("cl-shadowed-decorator")\nclass Decorated {}\n` +
      `interface HTMLElementTagNameMap { "cl-shadowed-map": LocalElement; }\n`,
  ],
]);

const root = writeProject(PROJECT);

/** The path of a file in the project, which a case is linted as. */
function inProject(path: string): string {
  return join(root, path);
}

/** Lit's `html`, imported, so a template's elements are looked up. */
const LIT_HTML = `import { html } from "lit";\n`;

/** A template using `<cl-a>` and `<cl-b>`, the span of each checked. */
const BAD_VIEW = `${LIT_HTML}import "./element-a.ts";\nexport const view = html\`\n  <cl-a></cl-a>\n  <cl-b x=\${1}></cl-b>\n\`;\n`;

testRule("registration-detection", probeRule, {
  // Built-in tags are never looked up.
  valid: [`${LIT_HTML}html\`<p></p>\`;\n`],
  invalid: [
    // A direct import counts; a tag registered elsewhere does not. Each
    // report spans the element's start tag, a binding inside it included.
    {
      code: BAD_VIEW,
      filename: inProject("bad.ts"),
      errors: [
        { ...element("cl-a", "element-a.ts", "yes"), ...spanOf(BAD_VIEW, "<cl-a>") },
        { ...element("cl-b", "element-b.ts", "no"), ...spanOf(BAD_VIEW, "<cl-b x=${1}>") },
      ],
    },
    {
      code: `${LIT_HTML}import "./element-a.ts";\nimport "./element-b.ts";\nhtml\`<cl-a></cl-a><cl-b></cl-b>\`;\n`,
      filename: inProject("good.ts"),
      errors: [element("cl-a", "element-a.ts", "yes"), element("cl-b", "element-b.ts", "yes")],
    },
    // An imported `index.ts` counts for its own folder, nested `index.ts`
    // included, but not for what it imports from outside it or re-exports
    // type-only.
    {
      code: `${LIT_HTML}import "./widgets/index.ts";\nhtml\`<cl-e></cl-e><cl-f></cl-f><cl-a></cl-a><cl-g></cl-g>\`;\n`,
      filename: inProject("uses-barrel.ts"),
      errors: [
        element("cl-e", "widgets/element-e.ts", "yes"),
        element("cl-f", "widgets/nested/element-f.ts", "yes"),
        element("cl-a", "element-a.ts", "no"),
        element("cl-g", "widgets/element-g.ts", "no"),
      ],
    },
    // A Deno-style `mod.ts` is not a barrel: what it re-exports is not followed.
    {
      code: `${LIT_HTML}import "./legacy/mod.ts";\nhtml\`<cl-i></cl-i>\`;\n`,
      filename: inProject("uses-mod.ts"),
      errors: [element("cl-i", "legacy/element-i.ts", "no")],
    },
    // A barrel that is not `index.ts` is not followed.
    {
      code: `${LIT_HTML}import "./register-elements.ts";\nhtml\`<cl-b></cl-b>\`;\n`,
      filename: inProject("indirect.ts"),
      errors: [element("cl-b", "element-b.ts", "no")],
    },
    // A type-only import runs nothing.
    {
      code: `${LIT_HTML}import type { ElementD } from "./element-d.ts";\nexport const slot: ElementD | null = null;\nhtml\`<cl-d></cl-d>\`;\n`,
      filename: inProject("type-only.ts"),
      errors: [element("cl-d", "element-d.ts", "no")],
    },
    // `customElements.define` and Lit's decorator register too.
    {
      code: `${LIT_HTML}import "./element-h.ts";\nhtml\`<cl-c></cl-c><cl-h></cl-h>\`;\n`,
      filename: inProject("uses-c.ts"),
      errors: [element("cl-c", "element-c.ts", "no"), element("cl-h", "element-h.ts", "yes")],
    },
    // Local names spelled like the registration means register nothing.
    {
      code: `${LIT_HTML}html\`<cl-shadowed-registry></cl-shadowed-registry><cl-shadowed-decorator></cl-shadowed-decorator><cl-shadowed-map></cl-shadowed-map>\`;\n`,
      filename: inProject("uses-shadowed.ts"),
      errors: [
        element("cl-shadowed-registry", "nowhere", "no"),
        element("cl-shadowed-decorator", "nowhere", "no"),
        element("cl-shadowed-map", "nowhere", "no"),
      ],
    },
  ],
});
