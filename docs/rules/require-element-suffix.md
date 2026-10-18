# lit-robust/require-element-suffix

📝 Require registered component class names to end in `Element`.

💼 This rule is enabled in the 🔤 `naming` [config](https://github.com/cunarist/eslint-plugin-lit-robust#configs-and-rules).

<!-- end auto-generated rule header -->

## Rule Details

This rule requires a registered component class name to end in `Element`.

A file usually holds a component plus the plain classes it works with. The
suffix says at a glance which one the browser instantiates.

- Only classes registered with `@customElement` are checked. A base class
  nothing registers is not an element yet.
- `tag-matches-class-name` strips a trailing `Element` before comparing, so the
  two rules agree: `cl-path-bar` accepts both `PathBar` and `PathBarElement`.

Examples of **incorrect** code for this rule:

```ts
@customElement("cl-path-bar")
class PathBar extends LitElement {}
```

Examples of **correct** code for this rule:

```ts
@customElement("cl-path-bar")
class PathBarElement extends LitElement {}
```

## When Not To Use It

This is a naming preference, and the opposite convention is just as common. If
your components are named without the suffix, turn this rule off.
