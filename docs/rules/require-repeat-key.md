# @cunarist/lit/require-repeat-key

📝 Require a key function in `repeat()`.

💼 This rule is enabled in the 🧩 `core` [config](https://github.com/cunarist/eslint-plugin-lit#configs-and-rules).

<!-- end auto-generated rule header -->

## Rule Details

`repeat` exists to reconcile a list by identity instead of by index, so that
reordering moves DOM rather than re-rendering it. Called without a key function
it falls back to index-based reconciliation, which is what binding the array
directly already does. The call then costs an import and a directive for no
change in behavior: reordering still re-renders every item, and per-item DOM
state, such as focus, scroll position, or an open menu, is still destroyed.

- `repeat(…)` is matched wherever it is called, not only inside a template,
  since [`simple-template-expressions`](simple-template-expressions.md) hoists
  directive calls into a local.
- Only `repeat` imported from Lit's `directives/repeat.js` module is checked.
  `this.repeat(a, b)` and `str.repeat(2)` are not touched.
- A spread argument could supply the key at runtime, so the arity is unknowable
  and the call is skipped.

Examples of **incorrect** code for this rule:

```ts
const rows = repeat(this.items, this.#renderRow);
```

Examples of **correct** code for this rule:

```ts
const rows = repeat(this.items, (item) => item.id, this.#renderRow);
```

## When Not To Use It

If you use the two-argument `repeat` on purpose and accept index-based
reconciliation, bind the array directly instead; there is little reason to turn
this rule off.
