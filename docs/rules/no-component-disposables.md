# lit-robust/no-component-disposables

📝 Disallow creating disposable resources and listeners inside a Lit component.

💼 This rule is enabled in the 🔄 `reactive-controller` [config](https://github.com/cunarist/eslint-plugin-lit-robust#configs-and-rules).

<!-- end auto-generated rule header -->

## Rule Details

A component declares what to render; anything with a lifetime belongs to
something that can release it. An observer created in a component is released,
if at all, in a different method, often a different screenful of code, and when
someone later adds an early return between the two the leak is invisible. A
`ReactiveController` acquires in `hostConnected` and releases in
`hostDisconnected`, adjacent lines in one file, and Lit calls both for you.

- Constructing `AbortController`, `EventSource`, `IntersectionObserver`,
  `MutationObserver`, `ResizeObserver`, `WebSocket`, or `Worker` is
  reported, matched by the last name segment, so `globalThis.WebSocket` is
  caught alongside a bare `WebSocket`.
- Calling `addEventListener` or `removeEventListener` on anything is
  reported. `removeEventListener` is banned on purpose: if the release happens
  in the component, the acquisition does too.
- Methods like `destroy()`, `dispose()`, or `disconnect()` are not matched:
  those names belong to ordinary objects, a chart or a database handle, as often
  as to resources.
- Only code inside a Lit component class body is checked. The same code in a
  controller is exactly what the rule wants.
- Declarative `@click=` bindings in a template are untouched.

Examples of **incorrect** code for this rule:

```ts
class El extends LitElement {
  go() {
    this.#observer = new ResizeObserver(this.#onResize);
    this.#el.addEventListener("scroll", this.#onScroll);
  }
}
```

Examples of **correct** code for this rule:

```ts
class SizeController {
  #observer = null;

  hostConnected() {
    this.#observer = new ResizeObserver(this.#onResize);
  }

  hostDisconnected() {
    this.#observer.disconnect();
  }
}
```

## When Not To Use It

If your components manage their own observers and listeners, turn this rule
off.
