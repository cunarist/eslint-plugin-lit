# lit-robust/no-string-context-key

📝 Disallow a string literal as a `createContext()` key.

💼 This rule is enabled in the 🔒 `strict` [config](https://github.com/cunarist/eslint-plugin-lit-robust#configs-and-rules).

💡 This rule is manually fixable by [editor suggestions](https://eslint.org/docs/latest/use/core-concepts#rule-suggestions).

<!-- end auto-generated rule header -->

## Rule Details

This rule reports a string literal passed as the key to `createContext()` from
`@lit/context`.

Context resolution dispatches a `context-request` event that bubbles up the tree,
and a provider answers when its own key matches the requested one. Strings
compare by value, so the key is effectively a global name. Any other component
on the page, including one from a dependency you did not write, that picks
`"theme"` will answer your consumer's request, and it will look like your
provider returned the wrong value. A `Symbol` is unique per call site, so two
packages can both name a context `"theme"` and never collide.

- Only `createContext` imported from `@lit/context` is checked, by name or
  through a namespace import. Another function called `createContext` is not.
- Non-literal keys are left alone, since the rule cannot see what
  `createContext<T>(BOARD_KEY)` holds.
- The rule suggests wrapping the key in `Symbol()`. The string becomes a
  description only, used in debugging output and not in matching, so the old
  name can stay. Every provider and consumer of that key must move together.

Examples of **incorrect** code for this rule:

```ts
const boardContext = createContext<BoardContext>("board");
```

Examples of **correct** code for this rule:

```ts
const boardContext = createContext<BoardContext>(Symbol("board"));
```

## When Not To Use It

If other code you do not control provides or consumes a context by its string
key, a symbol would break that, so turn this rule off for that context.
