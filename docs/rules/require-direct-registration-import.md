# @cunarist/lit/require-direct-registration-import

📝 Require importing the module that registers each custom element a template uses.

💼 This rule is enabled in the 🧩 `core` [config](https://github.com/cunarist/eslint-plugin-lit#configs-and-rules).

<!-- end auto-generated rule header -->

## Rule Details

A custom element renders as long as some module has run its
`customElements.define`. So a template can use `<cl-widget>` while a different
file is what imported and registered it. The tag works by borrowing that other
import, and the day it is removed for an unrelated reason, this template
silently renders an unknown element. Importing the registering module here makes
the usage carry its own reason to work.

- Which module registers a tag is read from the project around the linted file:
  the directory of the nearest `tsconfig.json`, else `package.json`, and the
  declaration files its imports reach. A tag registered nowhere in that index is
  not reported.
- A tag counts as registered through a `customElements.define` call, Lit's
  `@customElement` decorator, or an `HTMLElementTagNameMap` augmentation, so
  both app elements and compiled dependencies are covered.
- A type-only import (`import type …`) never runs its module, so it does not
  count as importing the registration.
- A `mod.ts` stands for the folder it sits in, so importing `./widgets/mod.ts`
  also counts for anything under `./widgets/` that it runs. Any other barrel
  does not: it can pull a module in from anywhere, which is the borrowed import
  this rule rejects.
- An element registered in the same file needs no import and is not reported.

Examples of **incorrect** code for this rule:

```ts
// <cl-widget> works only while another file imports its module.
import { html, LitElement } from "lit";

export class Panel extends LitElement {
  override render() {
    return html`<cl-widget></cl-widget>`;
  }
}
```

Examples of **correct** code for this rule:

```ts
import { html, LitElement } from "lit";
import "./cl-widget.ts";

export class Panel extends LitElement {
  override render() {
    return html`<cl-widget></cl-widget>`;
  }
}
```

## When Not To Use It

If your application registers every element once from a single entry point by
design, every template borrows that import and this rule reports them all.
