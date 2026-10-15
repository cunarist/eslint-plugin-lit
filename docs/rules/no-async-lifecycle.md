# @cunarist/lit/no-async-lifecycle

📝 Disallow `async` Lit lifecycle hooks.

💼 This rule is enabled in the 🧩 `core` [config](https://github.com/cunarist/eslint-plugin-lit#configs-and-rules).

<!-- end auto-generated rule header -->

## Rule Details

Lit calls its lifecycle hooks synchronously and ignores the returned Promise. An
`async` hook runs up to its first `await` and then yields, so everything after
that resumes in a later microtask, after the update it was meant to affect has
already been committed. A value assigned there lands one render too late, and in
`shouldUpdate` the Promise is always truthy, so the check is silently bypassed.
Do the asynchronous work in a reactive controller and write the result to a
reactive property.

- Checked hooks: `willUpdate`, `update`, `shouldUpdate`, `firstUpdated`,
  `updated`, `connectedCallback`, `disconnectedCallback`.
- `performUpdate` is deliberately excluded. Lit awaits it and documents an async
  override as the supported way to defer an update.
- `render` is covered by [`no-async-render`](no-async-render.md) instead.
- Ordinary (non-lifecycle) methods may be `async`, and so may hooks on classes
  that are not Lit components.

Examples of **incorrect** code for this rule:

```ts
class El extends LitElement {
  async willUpdate() {
    this.items = await this.load();
  }
}
```

Examples of **correct** code for this rule:

```ts
class El extends LitElement {
  @state()
  accessor items = [];

  set loader(value: Loader) {
    this.items = value.items;
  }
}
```

## When Not To Use It

If you knowingly fire and forget asynchronous work from a hook and do not need
its result in the current update, turn it off.
