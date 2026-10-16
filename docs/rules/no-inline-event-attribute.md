# @cunarist/lit/no-inline-event-attribute

📝 Disallow inline event handler attributes in templates.

💼 This rule is enabled in the 🧩 `core` [config](https://github.com/cunarist/eslint-plugin-lit#configs-and-rules).

💡 This rule is manually fixable by [editor suggestions](https://eslint.org/docs/latest/use/core-concepts#rule-suggestions).

<!-- end auto-generated rule header -->

## Rule Details

An `onclick="doThing()"` attribute is compiled by the browser into a function
evaluated in global scope. It cannot see the component instance, so the handler
people expect to reach `this.doThing()` reaches a global `doThing` that does not
exist. Every strict Content-Security-Policy also blocks the attribute outright,
so the same markup that works in development silently does nothing in
production.

Written as a binding it is worse. `onclick=${this.go}` is an _attribute_
binding, so Lit stringifies the function and assigns the source text of it as
the attribute value. Lit's `@click=${…}` binding attaches a real listener, with
the component as `this`, and is removed when the element is torn down.

- Attribute names are matched against an explicit list of HTML event handler
  attributes rather than an `on` prefix, so ordinary attributes that begin with
  those letters (`once`, `only`) are not flagged.
- Both a string value and a bound value are reported; both are broken, for the
  reasons above. A bound value gets a suggestion to rename it to the `@` event
  binding.
- Attribute names are case-insensitive in HTML, so `onMouseOver` is caught as
  `onmouseover`.
- The diagnostic highlights the whole attribute, name and value together.

Examples of **incorrect** code for this rule:

```ts
html`<button onclick="doThing()">Go</button>`;
```

Examples of **correct** code for this rule:

```ts
html`<button @click=${this.onClick}>Go</button>`;
```

## When Not To Use It

If a template is rendered somewhere inline handlers are intended and allowed by
the page's policy, turn it off for that file.
