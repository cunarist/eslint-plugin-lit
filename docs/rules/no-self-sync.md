# lit-robust/no-self-sync

📝 Disallow a reactive controller calling its own `sync*()` methods.

💼 This rule is enabled in the 🔄 `reactive-controller` [config](https://github.com/cunarist/eslint-plugin-lit-robust#configs-and-rules).

<!-- end auto-generated rule header -->

## Rule Details

A reactive controller's `sync*()` methods are how its host pushes new state
into it, typically from a property setter. When the controller calls one of
its own sync methods, there is a second, hidden path into that state: a sync
now runs at a moment the host did not choose, with values the host did not
pass. Keep the host as the only caller and move the shared work into a private
method that each sync method calls.

- A call is flagged when it is `this.sync…()` on a public, identifier-named
  member. A private `#sync…()` helper is the escape hatch and is not flagged.
- Calls in nested callbacks count.
- A class is treated as a reactive controller when it declares
  `implements ReactiveController`, is named `*Controller`, or defines
  `hostConnected()` or `hostDisconnected()`, and it is not a Lit component.
- Lit components are detected within the file: classes that extend
  `LitElement`, `ReactiveElement`, `UpdatingElement`, a local name imported for
  `LitElement` from `lit`, or a component class declared earlier in the file.

Examples of **incorrect** code for this rule:

```ts
class ListController {
  syncItems(items: string[]) {
    this.items = items;
  }

  syncAll(items: string[]) {
    this.syncItems(items);
  }
}
```

Examples of **correct** code for this rule:

```ts
class ListController {
  syncItems(items: string[]) {
    this.#apply(items);
  }

  syncAll(items: string[]) {
    this.#apply(items);
  }

  #apply(items: string[]) {
    this.items = items;
  }
}
```

## When Not To Use It

If your controllers do not use the `sync*()` naming for host-driven updates,
or you name ordinary methods `sync…` with no such contract, turn this rule off.
