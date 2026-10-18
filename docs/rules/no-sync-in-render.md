# lit-robust/no-sync-in-render

📝 Disallow calling a reactive controller's `sync*()` methods from `render()`.

💼 This rule is enabled in the 🔄 `reactive-controller` [config](https://github.com/cunarist/eslint-plugin-lit-robust#configs-and-rules).

<!-- end auto-generated rule header -->

## Rule Details

A reactive controller's `sync*()` methods change its state. `render()` must be
a pure function of the component's state, and Lit may call it at any time, so
a sync there runs an unpredictable number of times and may schedule another
update. Sync the controller from the property setter that received the new
value instead.

- A call is flagged when it is `this.<field>.sync…()` inside `render()` and the
  field holds a controller: it is named `*controller` (any case), or it is set
  to a `new *Controller(...)` in a field initializer or a top-level constructor
  assignment. Platform classes such as `AbortController` do not count.
- Calls in nested callbacks inside `render()` count; methods of a class
  declared inside `render()` do not.
- Lit components are detected within the file: classes that extend
  `LitElement`, `ReactiveElement`, `UpdatingElement`, a local name imported for
  `LitElement` from `lit`, or a component class declared earlier in the file.

Examples of **incorrect** code for this rule:

```ts
class ListElement extends LitElement {
  #list = new ListController(this);

  render() {
    this.#list.syncItems(this.items);
    return html`<ul></ul>`;
  }
}
```

Examples of **correct** code for this rule:

```ts
class ListElement extends LitElement {
  #list = new ListController(this);

  set items(value: string[]) {
    this.#list.syncItems(value);
  }

  render() {
    return html`<ul></ul>`;
  }
}
```

## When Not To Use It

If your controllers' `sync…` methods are pure reads with no state change, the
rule reports them anyway; turn it off.
