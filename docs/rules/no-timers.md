# lit-robust/no-timers

📝 Disallow `setTimeout`, `setInterval`, `requestAnimationFrame`, and `queueMicrotask` inside a Lit component.

💼 This rule is enabled in the 🔄 `reactive-controller` [config](https://github.com/cunarist/eslint-plugin-lit-robust#configs-and-rules).

<!-- end auto-generated rule header -->

## Rule Details

A timer started in a component is a handle nobody releases. When the element
disconnects the callback still fires, still touches `this`, and still schedules
renders on a detached node. Timers are also usually there to let state "settle",
a debounce or a deferred measurement, which means the component is working
around its own render order instead of deriving what it needs. A
`ReactiveController` can start the timer in `hostConnected` and clear it in
`hostDisconnected`, in one file, so the release cannot be forgotten.

- `setTimeout`, `setInterval`, `requestAnimationFrame`, and
  `queueMicrotask` are reported.
- The last name segment is matched, so `globalThis.setTimeout(...)` fires, and
  so does any `x.setTimeout()` inside a component.
- Only code inside a Lit component class body is checked. The same call in a
  controller, a plain class, or module scope is fine.
- `clearTimeout` and `clearInterval` are not reported, but inside a component
  they imply a timer this rule already rejected.

Examples of **incorrect** code for this rule:

```ts
class El extends LitElement {
  go() {
    setTimeout(() => this.#refresh(), 200);
  }
}
```

Examples of **correct** code for this rule:

```ts
class DebounceController {
  #handle = 0;

  hostConnected() {
    this.#handle = setInterval(this.#tick, 200);
  }

  hostDisconnected() {
    clearInterval(this.#handle);
  }
}
```

## When Not To Use It

If your components schedule their own work, turn this rule off.
