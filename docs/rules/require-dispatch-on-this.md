# @cunarist/lit/require-dispatch-on-this

📝 Require a component's events to be dispatched on the component itself.

💼 This rule is enabled in the 🧩 `core` [config](https://github.com/cunarist/eslint-plugin-lit#configs-and-rules).

💡 This rule is manually fixable by [editor suggestions](https://eslint.org/docs/latest/use/core-concepts#rule-suggestions).

<!-- end auto-generated rule header -->

## Rule Details

A parent listens with `@edit=${this.#onEdit}`, which adds the listener to that
element. An event dispatched anywhere else never reaches it. The code looks
right, the handler never runs, and there is nothing in the console.

- `this.renderRoot.dispatchEvent(…)` is accepted; the event still reaches the
  host through the shadow boundary when `composed` is set.
- A receiver the rule cannot resolve, such as a call result or a computed index,
  is left alone rather than guessed at.
- Only calls inside Lit components are checked.
- The rule suggests dispatching on `this` instead.

Examples of **incorrect** code for this rule:

```ts
class El extends LitElement {
  #commit() {
    this.#bus.dispatchEvent(new CustomEvent("edit"));
  }
}
```

Examples of **correct** code for this rule:

```ts
class El extends LitElement {
  #commit() {
    this.dispatchEvent(new CustomEvent("edit", { detail: this.value }));
  }
}
```

## When Not To Use It

If a component deliberately dispatches on another target, such as `window` or a
shared event bus that nobody listens to through `@event=`, this rule reports
those calls.
