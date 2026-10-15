# @cunarist/lit/no-private-properties

📝 Disallow declaring a private field as a public reactive property.

💼 This rule is enabled in the 🧩 `core` [config](https://github.com/cunarist/eslint-plugin-lit#configs-and-rules).

<!-- end auto-generated rule header -->

## Rule Details

`#count` is private at the language level: nothing outside the class can read
or write it, and the runtime enforces that. `@property` declares the opposite, a
public attribute that markup and parent components are expected to set. The two
statements contradict each other, and Lit still creates the attribute, pointing
at a field no one can reach. `@state` is the internal form.

- Only the `#` spelling is checked. A leading underscore is a convention, not a
  language feature; some codebases use `_id` for a genuinely public field, so
  keying on it would report correct code.
- `@state` on a `#` field is correct and never reported: internal reactive
  state is exactly what a private name is for.
- Entries of a `static properties` object are checked the same way.

Examples of **incorrect** code for this rule:

```ts
class El extends LitElement {
  @property({ type: Boolean })
  accessor #open = false;
}
```

Examples of **correct** code for this rule:

```ts
class El extends LitElement {
  @state()
  accessor #open = false;
}
```

## When Not To Use It

There is no working use of `@property` on a `#` field, so there is no reason
to turn it off.
