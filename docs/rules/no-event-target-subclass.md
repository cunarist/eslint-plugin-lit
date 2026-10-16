# @cunarist/lit/no-event-target-subclass

📝 Disallow classes that extend `EventTarget`.

💼 This rule is enabled in the 🔒 `strict` [config](https://github.com/cunarist/eslint-plugin-lit#configs-and-rules).

<!-- end auto-generated rule header -->

## Rule Details

This rule reports a class that directly extends `EventTarget`.

Subclassing `EventTarget` builds a state bus that Lit knows nothing about.
Nothing re-renders when it fires, so every consumer has to add a listener, call
`requestUpdate()` by hand, and remove the listener when it disconnects, which is
the step people forget. The event name is a string and the payload is untyped,
so a typo surfaces at runtime. A context does the same job without any of that:
`@provide` publishes the value, `@consume` re-renders on change, and Lit handles
the teardown.

- Only a direct `extends EventTarget` is reported. `LitElement` reaches
  `EventTarget` through `HTMLElement`, and that indirect inheritance is fine.
- Dispatching events from a component is not affected; this rule is about
  state buses, not events.

Examples of **incorrect** code for this rule:

```ts
class SettingsStore extends EventTarget {
  #theme = "dark";
  set theme(value: string) {
    this.#theme = value;
    this.dispatchEvent(new Event("change"));
  }
}
```

Examples of **correct** code for this rule:

```ts
class Root extends LitElement {
  @provide({ context: settingsContext })
  accessor settings = initialSettings;
}
```

## When Not To Use It

If you have a plain event emitter that has nothing to do with application
state, such as a utility class outside your components, this rule reports it
anyway. Turn it off for that file.
