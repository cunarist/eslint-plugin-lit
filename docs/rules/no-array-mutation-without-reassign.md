# lit-robust/no-array-mutation-without-reassign

📝 Disallow mutating array methods on reactive properties.

💼 This rule is enabled in the 🧩 `core` [config](https://github.com/cunarist/eslint-plugin-lit-robust#configs-and-rules).

💡 This rule is manually fixable by [editor suggestions](https://eslint.org/docs/latest/use/core-concepts#rule-suggestions).

<!-- end auto-generated rule header -->

## Rule Details

Lit decides whether a property changed with `!==` by default. A mutating method
such as `push` alters the array in place and leaves its identity untouched, so
the comparison says nothing changed and no update is scheduled. The data really
did change, so the component's state and its DOM silently disagree until some
unrelated property forces a render. Assign a new array instead: that is what
Lit's change detection is designed to see.

- Mutating methods checked: `push`, `pop`, `shift`, `unshift`, `splice`, `sort`,
  `reverse`, `fill`, `copyWithin`.
- Only a direct `this.<prop>` receiver whose property is reactive is flagged:
  declared with `@property` or `@state`, or listed in `static properties`, on a
  Lit component. Mutating a local array or a plain field is fine, so building
  the next array locally and assigning it once is the recommended fix for a
  large batch.
- `this.items = this.items.sort()` is still flagged, and correctly so: `sort`
  returns the same array, so the assignment does not change identity either. Use
  `[...this.items].sort()`.
- A `push` or `unshift` used as a statement gets a suggestion that assigns the
  spread array instead.
- A property with a custom `hasChanged` could legitimately mutate in place. The
  rule cannot see that and will report a false positive there.

Examples of **incorrect** code for this rule:

```ts
class El extends LitElement {
  @property({ type: Array })
  accessor items = [];

  add(item) {
    this.items.push(item);
  }
}
```

Examples of **correct** code for this rule:

```ts
class El extends LitElement {
  @property({ type: Array })
  accessor items = [];

  add(item) {
    this.items = [...this.items, item];
  }
}
```

## When Not To Use It

If your reactive arrays use a custom `hasChanged` or you call `requestUpdate()`
after mutating, turn it off.
