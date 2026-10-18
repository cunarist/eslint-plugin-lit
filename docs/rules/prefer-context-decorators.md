# lit-robust/prefer-context-decorators

📝 Enforce `@provide` and `@consume` over constructing `ContextProvider` or `ContextConsumer`.

💼 This rule is enabled in the 🔒 `strict` [config](https://github.com/cunarist/eslint-plugin-lit-robust#configs-and-rules).

<!-- end auto-generated rule header -->

## Rule Details

This rule reports constructing a `ContextProvider` or `ContextConsumer` by hand
inside a Lit component, where the `@provide` or `@consume` decorator would do.

The decorators do the same job in one line and keep the declaration next to the
value it describes. A hand-built provider splits that in two: the field holds a
wrapper, and the value you care about is reached through `.value`, which every
reader has to remember. The decorator form is also what the rest of this plugin
reads: [`no-context-mutation-by-consumer`](no-context-mutation-by-consumer.md)
and [`no-duplicate-context-provider`](no-duplicate-context-provider.md) look for
`@consume` and `@provide`, so an imperative provider escapes both.

- Renamed imports are followed:
  `import { ContextProvider as Provider } from "@lit/context"` still fires. A
  `ContextProvider` or `ContextConsumer` constructed by that name, or as the
  last part of a dotted name, is reported whatever it was imported from.
- Only Lit components are checked. A plain class has no host to decorate, so
  building the provider by hand is the only option there.
- `ContextRoot` is not covered, since it has no decorator.

Examples of **incorrect** code for this rule:

```ts
class El extends LitElement {
  #provider = new ContextProvider(this, { context: appContext });
}
```

Examples of **correct** code for this rule:

```ts
class El extends LitElement {
  @provide({ context: appContext })
  accessor appState = initial;
}
```

## When Not To Use It

If your build cannot use decorators, or a component needs to create its
provider or consumer conditionally at runtime, turn this rule off.
