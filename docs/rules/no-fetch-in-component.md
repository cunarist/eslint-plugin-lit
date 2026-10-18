# lit-robust/no-fetch-in-component

📝 Disallow calling `fetch` inside a Lit component.

💼 This rule is enabled in the 🔄 `reactive-controller` [config](https://github.com/cunarist/eslint-plugin-lit-robust#configs-and-rules).

<!-- end auto-generated rule header -->

## Rule Details

A component renders; it does not own work with a lifetime. A request started
from a component has nothing that cancels it, and even where an abort handle
exists, it and the request end up in different methods, which is how
cancellation quietly stops working. The response then resolves against a
detached element.

Moving the request into a `ReactiveController` gives it an owner: the
controller aborts it in `hostDisconnected`, and the component reads the result
as ordinary state. This is the argument of
[`no-component-disposables`](no-component-disposables.md), applied to the
resource a component reaches for most often.

- Only the global `fetch` counts, written bare or as `globalThis.fetch`,
  `window.fetch`, or `self.fetch`. A method named `fetch` on another object,
  such as `this.#api.fetch(...)`, is not checked.
- Passing a `signal` does not exempt the call: the objection is that the
  component owns the request at all.
- Only code inside a Lit component class is checked. A `fetch` at module scope
  or in a plain class is not this rule's business.

Examples of **incorrect** code for this rule:

```ts
class PathBar extends LitElement {
  async load() {
    const response = await fetch("/api/items");
    this.items = await response.json();
  }
}
```

Examples of **correct** code for this rule:

```ts
class PathBar extends LitElement {
  #data = new DataController(this);

  render() {
    return html`<ul>
      ${this.#data.items}
    </ul>`;
  }
}
```

## When Not To Use It

If your components load their own data, turn this rule off.
