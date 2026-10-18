# lit-robust/require-custom-element-registration

📝 Require every Lit component in a file to be registered as a custom element.

💼 This rule is enabled in the 🔒 `strict` [config](https://github.com/cunarist/eslint-plugin-lit-robust#configs-and-rules).

<!-- end auto-generated rule header -->

## Rule Details

This rule reports a Lit component class that the same file never registers,
either with `@customElement` or with `customElements.define`.

An unregistered custom element class has no tag name, so it can never appear in
a template. Everything about it still looks correct: the module type-checks,
the import resolves, the class is exported. The only symptom is that the
element never renders: the browser treats the unknown tag as an inert
`HTMLUnknownElement` and puts nothing in the console. The usual cause is a
component refactored out of another file that left its `@customElement` line
behind.

- Only the linted file is read for the registration. A class registered from
  another module, such as a barrel that imports it and calls
  `customElements.define`, is reported as unregistered.
- `abstract` classes are skipped.
- A class that this file both exports and extends is treated as a base class
  and skipped. A class extended here but not exported is still reported, since
  a purely local base has no reason to be one.
- A class counts as a component when its base class chain reaches
  `LitElement` or `ReactiveElement`, followed through imports.

Examples of **incorrect** code for this rule:

```ts
export class PanelElement extends LitElement {}
```

Examples of **correct** code for this rule:

```ts
@customElement("cl-panel")
export class PanelElement extends LitElement {}

export class DialogElement extends LitElement {}
customElements.define("cl-dialog", DialogElement);
```

## When Not To Use It

If you register components in a different file from the one that declares
them, this rule reports every one of them. Register each class in its own file,
or turn this rule off.
