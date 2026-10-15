import { spanOf, testRule } from "#testing";

import { simpleTemplateExpressionsRule } from "./simple-template-expressions.ts";

const LIT = 'import { html, LitElement } from "lit";\n';

/** An expected report of a binding that should be hoisted into a local. */
function hoist(shape: string): { messageId: string; data: { shape: string } } {
  return { messageId: "hoist", data: { shape } };
}

const directiveCode = `${LIT}const t = html\`<div>\${repeat(this.items, k, v)}</div>\`;`;
const arrowCode = `${LIT}const t = html\`<div @click=\${() => this.go()}></div>\`;`;
const renderCode = `${LIT}class X extends LitElement {\n  render() {\n    return this.open ? html\`<a></a>\` : html\`<b></b>\`;\n  }\n}`;

testRule("simple-template-expressions", simpleTemplateExpressionsRule, {
  valid: [
    // allows simple references
    `${LIT}const t = html\`<div>\${name}</div>\`;`,
    `${LIT}const t = html\`<div>\${this}</div>\`;`,
    `${LIT}const t = html\`<div>\${this.name}</div>\`;`,
    `${LIT}const t = html\`<div>\${this.a.b.c.d}</div>\`;`,
    `${LIT}class X {\n  #onClick = () => {};\n  view() {\n    return html\`<div @click=\${this.#onClick}></div>\`;\n  }\n}`,
    `${LIT}const t = html\`<x-y .prop=\${this.value}></x-y>\`;`,
    // allows the hoisted-out directive form
    `${LIT}function view() {\n  const renderedItems = repeat(this.items, (i) => this.itemId(i), this.renderNode);\n  return html\`<div>\${renderedItems}</div>\`;\n}`,
    // ignores non-html templates
    "const t = sql`${a ? b : c}`;",
    // allows an early return inside an if
    `${LIT}class X extends LitElement {\n  render() {\n    if (this.open) {\n      return html\`<a></a>\`;\n    }\n    return html\`<b></b>\`;\n  }\n}`,
    // ignores conditional returns outside render()
    `${LIT}class X extends LitElement {\n  label() {\n    return this.open ? 1 : 2;\n  }\n}`,
  ],
  invalid: [
    // rejects directive calls, highlighting the offending expression
    {
      code: directiveCode,
      errors: [
        {
          messageId: "directive",
          data: { name: "repeat" },
          ...spanOf(directiveCode, "repeat(this.items, k, v)"),
        },
      ],
    },
    // rejects plain calls
    {
      code: `${LIT}const t = html\`<div>\${this.label()}</div>\`;`,
      errors: [hoist("call expression")],
    },
    // rejects arrow functions, highlighting the arrow function only
    {
      code: arrowCode,
      errors: [
        {
          messageId: "inlineFunction",
          data: { shape: "inline arrow function" },
          ...spanOf(arrowCode, "() => this.go()"),
        },
      ],
    },
    // rejects function expressions
    {
      code: `${LIT}const t = html\`<div @click=\${function () {}}></div>\`;`,
      errors: [{ messageId: "inlineFunction", data: { shape: "inline function expression" } }],
    },
    // rejects .bind(this)
    {
      code: `${LIT}const t = html\`<div @click=\${this.go.bind(this)}></div>\`;`,
      errors: [{ messageId: "bind" }],
    },
    // rejects .map(…)
    {
      code: `${LIT}const t = html\`<ul>\${this.items.map((i) => i.name)}</ul>\`;`,
      errors: [{ messageId: "map" }],
    },
    // rejects conditionals
    {
      code: `${LIT}const t = html\`<div>\${cond ? a : b}</div>\`;`,
      errors: [hoist("conditional expression")],
    },
    // rejects logical expressions
    {
      code: `${LIT}const t = html\`<div>\${a && b}</div>\`;`,
      errors: [hoist("logical `&&` expression")],
    },
    {
      code: `${LIT}const t = html\`<div>\${a || b}</div>\`;`,
      errors: [hoist("logical `||` expression")],
    },
    // rejects computed member access
    {
      code: `${LIT}const t = html\`<div>\${this.items[0]}</div>\`;`,
      errors: [hoist("computed member access")],
    },
    // rejects other complex shapes
    {
      code: `${LIT}const t = html\`<div>\${\`x\${y}\`}</div>\`;`,
      errors: [hoist("template literal")],
    },
    {
      code: `${LIT}const t = html\`<div .x=\${{ a: 1 }}></div>\`;`,
      errors: [hoist("object literal")],
    },
    {
      code: `${LIT}const t = html\`<div .x=\${[1, 2]}></div>\`;`,
      errors: [hoist("array literal")],
    },
    {
      code: `${LIT}const t = html\`<div>\${await this.load()}</div>\`;`,
      errors: [hoist("`await` expression")],
    },
    {
      code: `${LIT}const t = html\`<div>\${a + b}</div>\`;`,
      errors: [hoist("binary `+` expression")],
    },
    {
      code: `${LIT}const t = html\`<div>\${new Date()}</div>\`;`,
      errors: [hoist("`new` expression")],
    },
    {
      code: `${LIT}const t = html\`<div>\${html\`<p></p>\`}</div>\`;`,
      errors: [hoist("nested tagged template")],
    },
    // reports every offending binding
    {
      code: `${LIT}const t = html\`<div>\${a()}\${b ? c : d}\${this.x}</div>\`;`,
      errors: [hoist("call expression"), hoist("conditional expression")],
    },
    // rejects a conditional return in render()
    {
      code: renderCode,
      errors: [
        {
          messageId: "conditionalRender",
          ...spanOf(renderCode, "this.open ? html`<a></a>` : html`<b></b>`"),
        },
      ],
    },
  ],
});
