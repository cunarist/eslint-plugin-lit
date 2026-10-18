# lit-robust/no-this-assign-in-render

📝 Disallow assigning to `this` or its members inside `render()`.

💼 This rule is enabled in the 🧩 `core` [config](https://github.com/cunarist/eslint-plugin-lit-robust#configs-and-rules).

<!-- end auto-generated rule header -->

## Rule Details

`render()` must be a pure function of the component's state. Lit may call it
more than once per update and does not guarantee when, so a mutation there
makes the output depend on how many times it ran. If the mutated field is
reactive, the assignment schedules another render and the update cycle loops.

- Any assignment target that bottoms out at `this` is flagged, at any depth:
  `this.count`, `this.state.count`, and `this.items[0]` all fire. This is
  broader than reactive properties.
- Increments (`this.count++`) count as assignments.
- The check is lexical: anything inside `render()`, at any nesting depth, is
  reported. A callback declared there counts, including
  `[1].forEach(() => { this.count = 1; })`.
- That is exact rather than approximate because
  [`simple-template-expressions`](simple-template-expressions.md) requires a
  bare name in every binding, so an inline handler
  (`@click=${() => this.count++}`) cannot be written inside `render()` to begin
  with. Moving the handler to a class field satisfies both rules.
- A callback hoisted to a local in `render()` and only passed to the template
  still reports; telling it apart needs dataflow analysis.
- Reading from `this` is fine, as is assigning to a local variable.

Examples of **incorrect** code for this rule:

```ts
class El extends LitElement {
  render() {
    this.count = 1;
    return html``;
  }
}
```

Examples of **correct** code for this rule:

```ts
class El extends LitElement {
  @state()
  accessor count = 0;

  #onClick = () => {
    this.count += 1;
  };

  render() {
    return html`<button @click=${this.#onClick}>+</button>`;
  }
}
```

## When Not To Use It

If `simple-template-expressions` is off and you write handlers inline in
templates, this rule reports every one that assigns through `this`.
