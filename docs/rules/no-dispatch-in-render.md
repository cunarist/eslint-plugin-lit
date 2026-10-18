# lit-robust/no-dispatch-in-render

📝 Disallow dispatching events from `render()`.

💼 This rule is enabled in the 🧩 `core` [config](https://github.com/cunarist/eslint-plugin-lit-robust#configs-and-rules).

<!-- end auto-generated rule header -->

## Rule Details

`render()` must be a pure function of the component's state. Lit may call it
more than once per update and does not guarantee when, so an event dispatched
there fires an unpredictable number of times. Worse, a listener that reacts by
writing back to a reactive property schedules another render, which dispatches
again: a loop with no obvious cause in the stack trace. Dispatch from the event
handler that caused the change, or from the setter that received the new value.

- Any receiver is flagged, not just `this`: `window.dispatchEvent(...)` and
  `target.dispatchEvent(...)` are side effects too.
- Nested callbacks count. A dispatch inside a `forEach` callback declared in
  `render()` still fires.
- Only `render()` of classes that extend `LitElement` or `ReactiveElement` is
  checked.

Examples of **incorrect** code for this rule:

```ts
class El extends LitElement {
  render() {
    this.dispatchEvent(new CustomEvent("rendered"));
    return html`<p></p>`;
  }
}
```

Examples of **correct** code for this rule:

```ts
class El extends LitElement {
  #onClick = () => {
    this.dispatchEvent(new CustomEvent("chosen"));
  };
}
```

## When Not To Use It

If `render()` dispatches from a callback it only defines, such as a handler
passed into the template, and never calls, the rule reports it anyway; turn it
off where that pattern is common.
