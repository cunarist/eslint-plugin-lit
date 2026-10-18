# lit-robust/require-context-type

📝 Require an explicit type argument on `createContext()`.

💼 This rule is enabled in the 🧩 `core` [config](https://github.com/cunarist/eslint-plugin-lit-robust#configs-and-rules).

<!-- end auto-generated rule header -->

## Rule Details

`createContext` is generic in the value the context carries. Called without a
type argument it produces a `Context<unknown, unknown>`, so every field that
consumes it widens to `unknown` and every provider accepts anything. The point
of a typed context, that a provider and its consumers agree on a shape, is lost,
and the mismatch surfaces at runtime as a property that is not there.

- Only `createContext` imported from `@lit/context` is checked, by name or
  through a namespace import such as `context.createContext(…)`. A function of
  the same name from elsewhere is left alone.
- Only the presence of a type argument is checked. Whether it matches the
  consumer's declared type needs the type checker.
- Write the context type out by name. Deriving it (`ContextType<typeof x>`)
  satisfies this rule but reads backwards.

Examples of **incorrect** code for this rule:

```ts
const boardContext = createContext(Symbol("board"));
```

Examples of **correct** code for this rule:

```ts
const boardContext = createContext<BoardContext>(Symbol("board"));
```

## When Not To Use It

If a context really carries any value, write `createContext<unknown>(…)` to say
so. Leaving the type argument out is never clearer, so keep this rule on.
