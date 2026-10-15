# @cunarist/lit/require-tag-prefix

📝 Require a namespace prefix in custom element names.

💼 This rule is enabled in the 🔤 `naming` [config](https://github.com/cunarist/eslint-plugin-lit#configs-and-rules).

<!-- end auto-generated rule header -->

## Rule Details

This rule requires a custom element name to carry a namespace segment.

The custom element registry is global to the page. Two libraries that both
define `<button-group>` cannot be loaded together: the second
`customElements.define()` throws. A prefix makes the collision impossible.

- Which prefix is not checked, only that one is present: the rule takes no
  options, so it cannot be told your project's. Consistency across files is not
  checked either, for the same reason.
- The test is whether any leading segment remains once the class name is
  accounted for, with or without a trailing `Element`.
- The report highlights the tag passed to the class decorator.

Examples of **incorrect** code for this rule:

```ts
@customElement("path-bar")
class PathBar extends LitElement {}
```

Examples of **correct** code for this rule:

```ts
@customElement("cl-path-bar")
class PathBar extends LitElement {}
```

## When Not To Use It

If your elements are only ever loaded into an application you control, where no
other library registers elements, turn this rule off.
