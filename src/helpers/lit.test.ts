import type { TSESTree } from "@typescript-eslint/types";
import { join } from "node:path";
import { vi } from "vite-plus/test";

import { type ExpectedError, testRule, writeProject } from "#testing";

import type { ClassNode } from "./ast.ts";
import type { LitTemplateKind } from "./identity.ts";
import { isLitComponent, isTaggedWith } from "./lit.ts";
import type { LitRule } from "./rule.ts";

// Cases here follow imports across a written project, so the first case of
// each host runs cold; give this file's tests headroom.
vi.setConfig({ testTimeout: 20_000 });

/** Every tag kind the probe asks about, in the order it reports them. */
const KINDS: LitTemplateKind[] = ["html", "svg", "css"];

/**
 * A rule that reports what the helpers detect, so the detection itself runs
 * under both hosts: every Lit component class and every Lit template tag.
 * Custom element registration is probed in `registration.test.ts`.
 */
const probeRule: LitRule = {
  meta: {
    type: "problem",
    docs: { description: "Report what the Lit detection helpers find" },
    schema: [],
    messages: {
      component: "{{name}} is a Lit component.",
      template: "This is a Lit {{kind}} template.",
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

/** Files holding base classes, Lit's and lookalikes. */
const PROJECT = new Map<string, string>([
  ["tsconfig.json", "{}\n"],
  ["package.json", `{ "type": "module" }\n`],
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
]);

const root = writeProject(PROJECT);

/** The path of a file in the project, which a case is linted as. */
function inProject(path: string): string {
  return join(root, path);
}

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
  ],
});
