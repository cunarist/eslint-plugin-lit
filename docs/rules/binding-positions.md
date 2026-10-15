# @cunarist/lit/binding-positions

📝 Disallow bindings in tag names, closing tags, and attribute names.

💼 This rule is enabled in the 🧩 `core` [config](https://github.com/cunarist/eslint-plugin-lit#configs-and-rules).

<!-- end auto-generated rule header -->

## Rule Details

Lit compiles a template once and can only bind attribute values, properties,
events, and child content. A binding in any other position is not a binding at
all: the expression is never evaluated, and the markup around it is parsed as
literal text. The element you meant to create simply does not appear.

- A binding as a tag name (`<${this.tag}>`), inside a closing tag
  (`</${this.tag}>`), or as an attribute name (`<div ${this.attr}="x">`) is
  reported.
- At most one diagnostic is reported per template: the rule stops at the first
  bad position it finds.
- Dynamic tag names have no supported form in Lit. Branch on the tag with
  separate templates instead.

Examples of **incorrect** code for this rule:

```ts
const t = html`<${this.tag}>`;
const t2 = html`</${this.tag}>`;
const t3 = html`<div ${this.attr}="x"></div>`;
```

Examples of **correct** code for this rule:

```ts
const t = html`<div class=${this.cls}></div>`;
const t2 = html`<div @click=${this.onClick}></div>`;
const t3 = html`<x-y .prop=${this.value}></x-y>`;
```

## When Not To Use It

Every position it reports is one Lit cannot bind, so there is little reason to
turn it off outside templates that are not Lit's but use its `html` import.
