# @cunarist/lit/require-tag-name-map

📝 Require an `HTMLElementTagNameMap` entry for every `@customElement` registration.

💼 This rule is enabled in the 🔒 `strict` [config](https://github.com/cunarist/eslint-plugin-lit#configs-and-rules).

💡 This rule is manually fixable by [editor suggestions](https://eslint.org/docs/latest/use/core-concepts#rule-suggestions).

<!-- end auto-generated rule header -->

## Rule Details

This rule reports a Lit component registered with `@customElement` that has no
matching `HTMLElementTagNameMap` entry in the same file, or whose entry maps the
tag to a different class.

Without the augmentation, `document.querySelector("cl-path-bar")` types as
`Element` and every property access on it is either a cast or an error. The
declaration exists so the tag string maps back to the class, and the only place
it stays honest is next to the class it names. Put in a central types file, it
drifts the first time someone renames a component.

- The entry may come before or after the class.
- A wrong mapping is reported with its own message: an interface mapping
  `"cl-path-bar"` to `SideBar` while the decorator sits on `PathBar` fires.
  The rule suggests mapping the tag to the decorated class.
- For a missing entry, the rule suggests declaring it at the end of the file.
- Only `@customElement`-registered components are checked. A component
  registered by a `customElements.define(...)` call is not.
- Only the linted file is read, so the entry must be in the same file.

Examples of **incorrect** code for this rule:

```ts
@customElement("cl-path-bar")
export class PathBar extends LitElement {}
```

Examples of **correct** code for this rule:

```ts
declare global {
  interface HTMLElementTagNameMap {
    "cl-path-bar": PathBar;
  }
}

@customElement("cl-path-bar")
export class PathBar extends LitElement {}
```

## When Not To Use It

If you keep tag name map augmentations in a shared declaration file, this rule
reports every component anyway. Turn it off, or move each entry next to its
component.
