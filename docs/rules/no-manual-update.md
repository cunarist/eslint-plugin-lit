# lit-robust/no-manual-update

📝 Disallow a Lit component scheduling its own updates.

💼 This rule is enabled in the 🔒 `strict` [config](https://github.com/cunarist/eslint-plugin-lit-robust#configs-and-rules).

<!-- end auto-generated rule header -->

## Rule Details

This rule reports `this.requestUpdate()`, `this.performUpdate()`, and
`this.scheduleUpdate()` inside a Lit component.

Reactive properties already schedule renders. A component calling
`this.requestUpdate()` means some state that drives the template is not a
reactive property: it is a plain field, or a mutation inside an array, and the
call patches over that. Make the state a reactive property and the render
schedules itself.

- Only `this.<method>()` inside a Lit component is reported.
  `super.performUpdate()` is delegation and is left alone, as is
  `element.requestUpdate()` outside any component.
- A `ReactiveController` telling its host to re-render, under any field name,
  is the legitimate caller, and it never trips this rule: the call is on the
  host, and a controller is not a component.
- A class counts as a component when its base class chain reaches `LitElement`
  or `ReactiveElement`, followed through imports. A `@customElement` decorator,
  a `render()` method, or `static styles` alone does not make one.
- A hand-written reactive property setter needs `this.requestUpdate("name", old)`.
  This rule still reports it.

Examples of **incorrect** code for this rule:

```ts
class El extends LitElement {
  #items: string[] = [];
  add(item: string) {
    this.#items.push(item);
    this.requestUpdate();
  }
}
```

Examples of **correct** code for this rule:

```ts
class El extends LitElement {
  @state()
  accessor items: string[] = [];
  add(item: string) {
    this.items = [...this.items, item];
  }
}

class ClockController implements ReactiveController {
  #host: ReactiveControllerHost;
  constructor(host: ReactiveControllerHost) {
    this.#host = host;
    host.addController(this);
  }
  tick() {
    this.#host.requestUpdate();
  }
}
```

## When Not To Use It

If you write custom reactive property accessors, which must call
`this.requestUpdate()` themselves, turn this rule off for those components.
