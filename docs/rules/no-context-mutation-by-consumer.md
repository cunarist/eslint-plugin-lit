# lit-robust/no-context-mutation-by-consumer

📝 Disallow assigning to fields declared with `@consume`.

💼 This rule is enabled in the 🧩 `core` [config](https://github.com/cunarist/eslint-plugin-lit-robust#configs-and-rules).

<!-- end auto-generated rule header -->

## Rule Details

A `@consume` field is a view of a value that the provider owns. Writing to it
changes the consumer's local copy and nothing else: the provider does not see
the change, no sibling consumer sees it, and the next time the provider
publishes, the write is silently overwritten. Under
`@consume({ subscribe: true })` that can happen on the very next update, so the
assignment appears to work and then undoes itself.

Change the value where it lives. The usual shape is to put a callback on the
context object itself, so consumers ask the provider to change the value instead
of writing it.

- Compound assignment (`+=`) and update expressions (`++`) count as writes.
- Both plain fields and `accessor` fields are checked, and private `#name`
  fields are matched by name like any other.
- Mutating _through_ the field (`this.#settings.showSidebar = false`) is not
  flagged. It is also wrong, but a rule cannot tell an owned nested object from
  a borrowed one without types.

Examples of **incorrect** code for this rule:

```ts
class Panel extends LitElement {
  @consume({ context: appSettingsContext, subscribe: true })
  accessor #settings = EMPTY_APP_SETTINGS_CONTEXT;

  #hide() {
    this.#settings = { ...this.#settings, showSidebar: false };
  }
}
```

Examples of **correct** code for this rule:

```ts
class Panel extends LitElement {
  @consume({ context: appSettingsContext, subscribe: true })
  accessor #settings = EMPTY_APP_SETTINGS_CONTEXT;

  #hide() {
    this.#settings.updateSettings({ showSidebar: false });
  }
}
```

## When Not To Use It

If a consumer deliberately keeps a local override that it expects the provider
to replace, turn it off for that class.
