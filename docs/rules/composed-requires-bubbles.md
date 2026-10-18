# lit-robust/composed-requires-bubbles

📝 Require `bubbles: true` on events constructed with `composed: true`.

💼 This rule is enabled in the 🧩 `core` [config](https://github.com/cunarist/eslint-plugin-lit-robust#configs-and-rules).

💡 This rule is manually fixable by [editor suggestions](https://eslint.org/docs/latest/use/core-concepts#rule-suggestions).

<!-- end auto-generated rule header -->

## Rule Details

`composed` does not make an event propagate. It only says "when propagation
reaches a shadow boundary, keep going". Propagation upward is what `bubbles`
turns on. So a composed event that does not bubble is dispatched at its target,
goes nowhere, and never reaches the boundary that `composed` was there to cross.

The failure is quiet in exactly the wrong way: the flag that was added to make
the event escape the component is the one that does nothing, and the listener on
the host element never fires.

- Only `new Event(…)` and `new CustomEvent(…)` with a literal init object are
  checked.
- Only a definite mistake is reported: `composed: true` with no `bubbles` key,
  or with a literal `bubbles: false`. A computed value such as
  `bubbles: shouldBubble` could be `true` at runtime, so it is left alone.
- An init object containing a spread or a computed key is skipped entirely:
  `bubbles` could be arriving through it.
- The rule does not require `composed`. Dropping it is the other correct fix if
  the event is meant to stay inside the component, so setting `bubbles: true` is
  offered as a suggestion, not a fix.

Examples of **incorrect** code for this rule:

```ts
new CustomEvent("item-selected", { composed: true });
new CustomEvent("item-selected", { composed: true, bubbles: false });
```

Examples of **correct** code for this rule:

```ts
new CustomEvent("item-selected", { bubbles: true, composed: true });
```

## When Not To Use It

If you deliberately dispatch composed, non-bubbling events for their effect at
the target, turn it off.
