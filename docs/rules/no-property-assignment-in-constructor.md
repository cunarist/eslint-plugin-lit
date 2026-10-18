# lit-robust/no-property-assignment-in-constructor

📝 Disallow assigning a reactive property in the constructor.

💼 This rule is enabled in the 🔒 `strict` [config](https://github.com/cunarist/eslint-plugin-lit-robust#configs-and-rules).

<!-- end auto-generated rule header -->

## Rule Details

This rule reports an assignment to a reactive property of the same class inside
its `constructor()`.

Writing a reactive property in the constructor happens before the element is
connected, so Lit records it as a change from `undefined` and schedules an
update with nothing to react to. It is also the one write SSR hydration cannot
see: the server rendered from the values the markup carried, and the client
constructor overwrites them before the first `update()`, so hydration
mismatches and the server DOM is thrown away and rebuilt. A field initializer
runs at the same moment but counts as the property's default, not as a change.

- Reactive properties are those declared with `@property` or `@state`, or listed
  in `static properties`. Assigning a private field or an ordinary member is fine.
- Assignments nested in an `if` or `try` inside the constructor count, and so do
  compound ones like `+=`. Ones inside an arrow function, a function
  declaration, or a nested class do not, since that code runs later.
- Only the class's own declarations are read, so a property inherited from a
  base class is not seen.

Examples of **incorrect** code for this rule:

```ts
class El extends LitElement {
  @property()
  accessor label: string;

  constructor() {
    super();
    this.label = "";
  }
}
```

Examples of **correct** code for this rule:

```ts
class El extends LitElement {
  @property({ type: String })
  accessor label = "";
}
```

## When Not To Use It

If your components never render on the server and you prefer initializing state
in the constructor, turn this rule off. When a field must not be emitted at all,
prefer `declare` over a constructor assignment instead.
