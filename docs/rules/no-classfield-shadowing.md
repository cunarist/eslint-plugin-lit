# @cunarist/lit/no-classfield-shadowing

📝 Disallow class fields that shadow reactive properties.

💼 This rule is enabled in the 🧩 `core` [config](https://github.com/cunarist/eslint-plugin-lit#configs-and-rules).

💡 This rule is manually fixable by [editor suggestions](https://eslint.org/docs/latest/use/core-concepts#rule-suggestions).

<!-- end auto-generated rule header -->

## Rule Details

Under `useDefineForClassFields`, the default on modern targets, a class field
compiles to `Object.defineProperty`, not an assignment. That overwrites the
accessor Lit installed for the reactive property. The property keeps its value
but stops reacting: setting it no longer schedules an update, and the component
renders stale.

- Two shapes are caught: a field shadowing a reactive property on an ancestor
  class, and a field shadowing an entry of the same class's `static properties`.
- `declare` is type-only and emits nothing, so it is accepted. Setting the value
  in the constructor also works. `accessor` is likewise not flagged.
- A field with no value gets a suggestion to make it a `declare` field.
- The superclass chain is only searched for reactive properties through classes
  declared in the same module, up to 16 levels. Reactive properties of a base
  class imported from another file are invisible to this rule.
- If the chain never reaches a Lit component, the class is ignored entirely.

Examples of **incorrect** code for this rule:

```ts
class Base extends LitElement {
  @property()
  accessor name = "";
}
class El extends Base {
  name = "x";
}
```

Examples of **correct** code for this rule:

```ts
class Base extends LitElement {
  @property({ type: String })
  accessor name = "";
}
class El extends Base {
  declare name: string;
}
```

## When Not To Use It

If your build sets `useDefineForClassFields: false`, class fields are plain
assignments and do not replace Lit's accessors, so turn it off.
