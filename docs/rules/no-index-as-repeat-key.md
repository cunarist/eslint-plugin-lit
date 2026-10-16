# @cunarist/lit/no-index-as-repeat-key

📝 Disallow `repeat` key functions that return the item index.

💼 This rule is enabled in the 🧩 `core` [config](https://github.com/cunarist/eslint-plugin-lit#configs-and-rules).

<!-- end auto-generated rule header -->

## Rule Details

Keying by index makes every key stable against reordering by construction: item
0 is always key 0, whatever item currently sits there. `repeat` therefore sees
no list movement at all, reuses each row's DOM in place, and re-renders its
contents: the index-based reconciliation the directive exists to avoid. Worse
than useless, since it looks like the list is properly keyed. Key by something
that identifies the item.

- `repeat(...)` is matched wherever it is called, not only inside a template.
  See [`simple-template-expressions`](simple-template-expressions.md).
- Only `repeat` imported from Lit's `directives/repeat.js` module is checked;
  `this.repeat(…)` and other functions are not touched.
- Both expression bodies and a block body whose single statement returns the
  index are detected, for arrow functions and function expressions alike.
- Only a direct return of the index parameter is flagged. An index laundered
  through another expression, such as a string conversion, is not detected: the
  rule stays precise rather than guessing.

Examples of **incorrect** code for this rule:

```ts
const rows = repeat(this.items, (item, i) => i, this.renderRow);
```

Examples of **correct** code for this rule:

```ts
const rows = repeat(this.items, (item) => item.id, this.renderRow);
```

## When Not To Use It

If a list never reorders and its items have no identity, an index key is
harmless; turn it off there.
