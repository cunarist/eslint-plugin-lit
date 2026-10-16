# @cunarist/lit/require-event-in-event-map

📝 Require an `HTMLElementEventMap` entry for every event a Lit component constructs.

💼 This rule is enabled in the 🔒 `strict` [config](https://github.com/cunarist/eslint-plugin-lit#configs-and-rules).

💡 This rule is manually fixable by [editor suggestions](https://eslint.org/docs/latest/use/core-concepts#rule-suggestions).

<!-- end auto-generated rule header -->

## Rule Details

This rule reports an event constructed inside a Lit component whose name has
no matching `HTMLElementEventMap` entry in the same file.

An event name is a public API. `HTMLElementEventMap` is the only place that maps
that name back to a type, and without an entry the compiler falls back to the
base `Event`: `addEventListener("cl-picked", (e) => e.detail)` does not compile,
and the cast that unblocks it is unchecked. Once the augmentation exists, both
sides agree, and a renamed event breaks the listener at build time instead of
silently never firing. Keeping the declaration in the file that dispatches the
event is what stops it drifting, as with
[`require-tag-name-map`](require-tag-name-map.md).

- Only the linted file is read, so an augmentation in a shared `events.d.ts` is
  not seen. The entry may come before or after the class.
- It triggers on construction, not on `dispatchEvent`: `new CustomEvent("x")`
  inside a component is reported even if never dispatched, and an event built
  outside the component and passed in is not.
- Only `Event` and `CustomEvent` are recognized, and only when the name is a
  string literal. A subclass or a computed name is skipped.
- The rule suggests declaring the event at the end of the file, typed as the
  class that constructs it. Narrow `CustomEvent` to its detail type afterwards.

Examples of **incorrect** code for this rule:

```ts
class PathBar extends LitElement {
  fire() {
    this.dispatchEvent(new CustomEvent("cl-picked", { detail: this.path }));
  }
}
```

Examples of **correct** code for this rule:

```ts
declare global {
  interface HTMLElementEventMap {
    "cl-picked": CustomEvent<string>;
  }
}

class PathBar extends LitElement {
  fire() {
    this.dispatchEvent(new CustomEvent("cl-picked", { detail: this.path }));
  }
}
```

## When Not To Use It

If you keep event map augmentations in a shared declaration file, this rule
reports every event anyway. Turn it off, or move each entry next to its
component.
