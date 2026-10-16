# @cunarist/lit/no-native-attributes

📝 Disallow reactive properties named after global HTML attributes.

💼 This rule is enabled in the 🧩 `core` [config](https://github.com/cunarist/eslint-plugin-lit#configs-and-rules).

<!-- end auto-generated rule header -->

## Rule Details

`HTMLElement` already defines an accessor for `id`, `title`, `role` and the
rest. Declaring a reactive property with the same name replaces it, so Lit's
accessor and the platform's fight over the same slot. The DOM, CSS selectors,
and assistive technology all read the native attribute and get something other
than what you set.

- The banned names are `role`, `title`, `id`, `slot`, `style`, `class`,
  `hidden`, `lang`, `dir`, `tabindex`.
- Matching is case-insensitive, so `tabIndex` is flagged as `tabindex`.
- Only reactive properties count: `@property`, `@state`, and
  `static properties` entries. An undecorated field named `title` or a private
  `#role` is left alone.
- Names that merely contain a native name are fine; `headingId` does not match
  `id`.

Examples of **incorrect** code for this rule:

```ts
class El extends LitElement {
  @property()
  title = "";
}
```

Examples of **correct** code for this rule:

```ts
class El extends LitElement {
  @property({ type: String })
  accessor label = "";
  @property({ type: String, attribute: "heading-id" })
  accessor headingId = "";
}
```

## When Not To Use It

If a component deliberately takes over a native attribute and reimplements its
platform behavior, this rule reports that property.
