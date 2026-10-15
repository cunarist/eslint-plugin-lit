# @cunarist/lit/no-update-complete

📝 Disallow accessing `updateComplete`.

💼 This rule is enabled in the 🔒 `strict` [config](https://github.com/cunarist/eslint-plugin-lit#configs-and-rules).

<!-- end auto-generated rule header -->

## Rule Details

This rule reports any access to a member named `updateComplete`.

`await this.updateComplete` means "let the DOM settle, then read it back". That
turns rendering into a two-phase process where the second phase depends on
timing, and it is how render loops and flaky tests start: the awaited read feeds
a write that schedules another update. Anything you would learn by waiting is
either already in reactive state or belongs to a `ReactiveController` that
observes the DOM and reports back.

- The member access itself is reported, not the `await` around it, so
  `this.updateComplete.then(...)` and passing the promise around are caught too.
- It is deliberately not limited to Lit components: a controller reaching for
  `this.#host.updateComplete` makes the same mistake.
- Computed access, `this["updateComplete"]`, is not detected.

Examples of **incorrect** code for this rule:

```ts
class El extends LitElement {
  async go() {
    await this.updateComplete;
    this.#width = this.renderRoot.querySelector("input").offsetWidth;
  }
}
```

Examples of **correct** code for this rule:

```ts
class El extends LitElement {
  #size = new SizeController(this);

  render() {
    return html``;
  }
}
```

## When Not To Use It

If you measure the DOM after rendering or write tests that wait for a render,
this rule reports those. Turn it off in test files, or for components that need
post-render measurement and cannot move it into a controller.
