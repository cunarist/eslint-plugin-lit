# @cunarist/lit/lifecycle-allowlist

📝 Disallow Lit component lifecycle overrides other than `styles` and `render`.

💼 This rule is enabled in the 🔄 `reactive-controller` [config](https://github.com/cunarist/eslint-plugin-lit#configs-and-rules).

<!-- end auto-generated rule header -->

## Rule Details

`connectedCallback` and `disconnectedCallback` are where components acquire
things, listeners, observers, sockets, and where people forget to release them.
`firstUpdated` and `updated` are where DOM measurement leaks in, so rendering
stops being a pure function of state. Confining a component to `styles` and
`render` means the only lifetime a component manages is its own render.
`willUpdate` is banned too: pushing state into a controller belongs in a
property setter, where it runs when the value actually changes. Everything else
moves into a `ReactiveController`, where `hostConnected` and
`hostDisconnected` sit next to each other and the release is visible.

- The banned set: `connectedCallback`, `disconnectedCallback`, `willUpdate`,
  `firstUpdated`, `updated`, `shouldUpdate`, `update`, `performUpdate`,
  `requestUpdate`, and `scheduleUpdate`.
- Fields and accessors count, not just methods: `updated = () => {}` is
  rejected too.
- Only Lit component classes are checked. A plain class or a bare
  `extends HTMLElement` is ignored, so a controller's `hostConnected` is
  fine.
- Each override is reported separately, at its name.
- Where other rules suggest deriving a value in `willUpdate()`, do it in the
  setter that receives the input; where they suggest dispatching from
  `updated()`, dispatch from the handler that caused the change.

Examples of **incorrect** code for this rule:

```ts
class El extends LitElement {
  connectedCallback() {
    super.connectedCallback();
    this.#observer.observe(this);
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    this.#observer.disconnect();
  }
}
```

Examples of **correct** code for this rule:

```ts
class El extends LitElement {
  #size = new SizeController(this);

  static styles = css``;

  render() {
    return html``;
  }
}
```

## When Not To Use It

Post-render measurement and connect-time setup become controller work under
this rule. If you would rather keep that work in the component, turn this rule
off.
