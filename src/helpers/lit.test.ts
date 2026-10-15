import { dirname, join, relative } from "node:path";

import type { TSESTree } from "@typescript-eslint/types";
import { vi } from "vite-plus/test";

import type { ClassNode, LitRule, LitTemplateKind } from "#helpers";
import {
  isHtmlTemplate,
  isLitComponent,
  isTaggedWith,
  lintedRealPath,
  parseTemplate,
  rangeLoc,
  runtimeImports,
  tagRegistrations,
  templateSource,
  walkElements,
} from "#helpers";
import type { ExpectedError } from "#testing";
import { spanOf, testRule, writeProject } from "#testing";

// Cases here follow imports across a written project and build its
// registration index, so the first case of each host runs cold; give this
// file's tests headroom.
vi.setConfig({ testTimeout: 20_000 });

/** Every tag kind the probe asks about, in the order it reports them. */
const KINDS: LitTemplateKind[] = ["html", "svg", "css"];

/**
 * A rule that reports what the helpers detect, so the detection itself runs
 * under both hosts: every Lit component class, every Lit template tag, and
 * for each custom element in an `html` template, where its tag is registered
 * and whether this file runs that module.
 */
const probeRule: LitRule = {
  meta: {
    type: "problem",
    docs: { description: "Report what the Lit detection helpers find" },
    schema: [],
    messages: {
      component: "{{name}} is a Lit component.",
      template: "This is a Lit {{kind}} template.",
      element: "<{{tag}}> is registered in {{file}}, imported: {{imported}}.",
    },
  },
  create(context) {
    function checkClass(node: ClassNode): void {
      if (node.id !== null && isLitComponent(node, context)) {
        context.report({ node: node.id, messageId: "component", data: { name: node.id.name } });
      }
    }
    return {
      ClassDeclaration: checkClass,
      ClassExpression: checkClass,
      TaggedTemplateExpression(node: TSESTree.TaggedTemplateExpression): void {
        for (const kind of KINDS) {
          if (isTaggedWith(node, kind, context)) {
            context.report({ node: node.tag, messageId: "template", data: { kind } });
          }
        }
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

/** An expected component report. */
function component(name: string): ExpectedError {
  return { messageId: "component", data: { name } };
}

/** An expected template report. */
function template(kind: LitTemplateKind): ExpectedError {
  return { messageId: "template", data: { kind } };
}

/** An expected element report. */
function element(tag: string, file: string, imported: string): ExpectedError {
  return { messageId: "element", data: { tag, file, imported } };
}

/** Files that each register one tag in their own way. */
const PROJECT: Map<string, string> = new Map([
  ["tsconfig.json", "{}\n"],
  ["package.json", `{ "type": "module", "imports": { "#outside": "./element-a.ts" } }\n`],
  // Base classes in other files, reached by name, through a renaming barrel,
  // through `export *`, and through a declaration file's typed mixin.
  ["base.ts", `import { LitElement } from "lit";\nexport class Base extends LitElement {}\n`],
  ["barrel.ts", `export { Base as Renamed } from "./base.ts";\nexport * from "./star.ts";\n`],
  [
    "star.ts",
    `import { ReactiveElement } from "lit";\nexport class Star extends ReactiveElement {}\n`,
  ],
  [
    "mixin.d.ts",
    `import { LitElement } from "lit";\n` +
      `declare const Mixed_base: typeof LitElement & (new () => object);\n` +
      `export declare class Mixed extends Mixed_base {}\n`,
  ],
  ["not-lit.ts", `export class LitElement {}\n`],
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

testRule("lit-detection", probeRule, {
  valid: [
    // A local class or tag that merely shares a name with Lit's is not Lit's.
    `class LitElement {}\nexport class Fake extends LitElement {}\n`,
    `import { LitElement } from "lit";\nexport function make(LitElement: new () => object) {\n  return class Shadowed extends LitElement {};\n}\n`,
    `import { html } from "lit";\nexport function view(html: (strings: TemplateStringsArray) => string): string {\n  return html\`x\`;\n}\n`,
    {
      code: `import { LitElement } from "./not-lit.ts";\nexport class Fake extends LitElement {}\n`,
      filename: inProject("fake.ts"),
    },
    // An unresolvable import is silent, never a guess.
    `import { LitElement } from "./missing.ts";\nexport class Unknown extends LitElement {}\n`,
  ],
  invalid: [
    // An aliased import, a namespace access, and a subclassed base are all
    // followed; a local class or tag that merely shares a name is not.
    {
      code: `import { css, html as renderHtml, LitElement } from "lit";
import * as lit from "lit";
import { ReactiveElement } from "@lit/reactive-element";
export class LitPanel extends LitElement {}
export class ReactivePanel extends ReactiveElement {}
export class Colliding extends LitElement {}
{
  class Colliding {}
}
export const Expression = class Expression extends LitElement {};
renderHtml\`<p></p>\`;
lit.svg\`<circle></circle>\`;
css\`:host {}\`;
{
  const html = (strings: TemplateStringsArray) => strings;
  html\`not Lit\`;
}
`,
      errors: [
        component("LitPanel"),
        component("ReactivePanel"),
        component("Colliding"),
        component("Expression"),
        template("html"),
        template("svg"),
        template("css"),
      ],
    },
    // A base reached through a local class, a `const`, and a mixin call.
    {
      code: `import { LitElement } from "lit";
class Base extends LitElement {}
const Aliased = Base;
declare function Mixin<T>(base: T): T;
export class Through extends Aliased {}
export class Mixed extends Mixin(Base) {}
class Lookalike {}
export class Plain extends Lookalike {}
`,
      errors: [component("Base"), component("Through"), component("Mixed")],
    },
    // The static `html` is Lit's `html` too.
    {
      code: `import { html } from "lit/static-html.js";\nhtml\`<p></p>\`;\n`,
      errors: [template("html")],
    },
    // Bases in other files: by name, renamed through a barrel, through
    // `export *`, and through a declaration file's typed mixin.
    {
      code: `import { Base } from "./base.ts";
import { Renamed, Star } from "./barrel.ts";
import { Mixed } from "./mixin.d.ts";
export class FromBase extends Base {}
export class FromRenamed extends Renamed {}
export class FromStar extends Star {}
export class FromMixed extends Mixed {}
`,
      filename: inProject("components.ts"),
      errors: [
        component("FromBase"),
        component("FromRenamed"),
        component("FromStar"),
        component("FromMixed"),
      ],
    },
    // A direct import counts; a tag registered elsewhere does not. Each
    // report spans the element's start tag, a binding inside it included.
    {
      code: BAD_VIEW,
      filename: inProject("bad.ts"),
      errors: [
        template("html"),
        { ...element("cl-a", "element-a.ts", "yes"), ...spanOf(BAD_VIEW, "<cl-a>") },
        { ...element("cl-b", "element-b.ts", "no"), ...spanOf(BAD_VIEW, "<cl-b x=${1}>") },
      ],
    },
    {
      code: `${LIT_HTML}import "./element-a.ts";\nimport "./element-b.ts";\nhtml\`<cl-a></cl-a><cl-b></cl-b>\`;\n`,
      filename: inProject("good.ts"),
      errors: [
        template("html"),
        element("cl-a", "element-a.ts", "yes"),
        element("cl-b", "element-b.ts", "yes"),
      ],
    },
    // An imported `index.ts` counts for its own folder, nested `index.ts`
    // included, but not for what it imports from outside it or re-exports
    // type-only.
    {
      code: `${LIT_HTML}import "./widgets/index.ts";\nhtml\`<cl-e></cl-e><cl-f></cl-f><cl-a></cl-a><cl-g></cl-g>\`;\n`,
      filename: inProject("uses-barrel.ts"),
      errors: [
        template("html"),
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
      errors: [template("html"), element("cl-i", "legacy/element-i.ts", "no")],
    },
    // A barrel that is not `index.ts` is not followed.
    {
      code: `${LIT_HTML}import "./register-elements.ts";\nhtml\`<cl-b></cl-b>\`;\n`,
      filename: inProject("indirect.ts"),
      errors: [template("html"), element("cl-b", "element-b.ts", "no")],
    },
    // A type-only import runs nothing.
    {
      code: `${LIT_HTML}import type { ElementD } from "./element-d.ts";\nexport const slot: ElementD | null = null;\nhtml\`<cl-d></cl-d>\`;\n`,
      filename: inProject("type-only.ts"),
      errors: [template("html"), element("cl-d", "element-d.ts", "no")],
    },
    // `customElements.define` and Lit's decorator register too.
    {
      code: `${LIT_HTML}import "./element-h.ts";\nhtml\`<cl-c></cl-c><cl-h></cl-h>\`;\n`,
      filename: inProject("uses-c.ts"),
      errors: [
        template("html"),
        element("cl-c", "element-c.ts", "no"),
        element("cl-h", "element-h.ts", "yes"),
      ],
    },
    // Local names spelled like the registration means register nothing.
    {
      code: `${LIT_HTML}html\`<cl-shadowed-registry></cl-shadowed-registry><cl-shadowed-decorator></cl-shadowed-decorator><cl-shadowed-map></cl-shadowed-map>\`;\n`,
      filename: inProject("uses-shadowed.ts"),
      errors: [
        template("html"),
        element("cl-shadowed-registry", "nowhere", "no"),
        element("cl-shadowed-decorator", "nowhere", "no"),
        element("cl-shadowed-map", "nowhere", "no"),
      ],
    },
  ],
});
