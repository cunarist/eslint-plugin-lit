# @cunarist/lit/event-name-case

📝 Require kebab-case names for events created with `new CustomEvent()` or `new Event()`.

💼 This rule is enabled in the 🔤 `naming` [config](https://github.com/cunarist/eslint-plugin-lit#configs-and-rules).

💡 This rule is manually fixable by [editor suggestions](https://eslint.org/docs/latest/use/core-concepts#rule-suggestions).

<!-- end auto-generated rule header -->

## Rule Details

This rule requires the name given to `new CustomEvent(...)` or `new Event(...)`
to be kebab-case: lowercase words joined by dashes, no underscores.

Every event name the platform defines is lowercase: `click`, `pointerdown`,
`animationend`. Custom events are matched the same way, as a plain string, by
`addEventListener` and by Lit's `@name=` binding. Nothing checks the spelling. A
component that dispatches `"itemSelected"` and a listener written as
`@itemselected=` simply never talk to each other, with no error anywhere.

Kebab-case removes the question of where the capital letters went, and picks one
spelling so `"item_selected"` and `"item-selected"` cannot both float around.

- Only string literals are checked. `new CustomEvent(name)` is left alone.
- Dashes, colons, and dots are fine; uppercase and underscores are not. A
  namespaced `"cl:item-selected"` passes, `"item_selected"` does not.
- `DOMContentLoaded` is allowed, since it is a platform name that really is
  mixed-case.
- A suggestion rewrites the name in kebab-case, turning camel humps and
  underscores into dashes, so `"itemSelected"` and `"item_selected"` both become
  `"item-selected"`. It is not an autofix: every listener has to follow.

Examples of **incorrect** code for this rule:

```ts
new CustomEvent("itemSelected");
new Event("before_close");
```

Examples of **correct** code for this rule:

```ts
new CustomEvent("item-selected");
new Event("before-close");
```

## When Not To Use It

If you dispatch events whose names are fixed by a third-party consumer that
expects camelCase, turn this rule off.
