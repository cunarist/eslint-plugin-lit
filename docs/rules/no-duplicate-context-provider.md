# lit-robust/no-duplicate-context-provider

📝 Disallow providing the same context twice from one class.

💼 This rule is enabled in the 🧩 `core` [config](https://github.com/cunarist/eslint-plugin-lit-robust#configs-and-rules).

<!-- end auto-generated rule header -->

## Rule Details

`@provide({ context: x })` registers this element as the provider of `x`. Doing
it twice on the same element registers two providers for one key on one node.
Only one can answer a consumer's `context-request`, and which one wins is an
implementation detail of the order the decorators ran. The other field looks
live (it has a value, it is reactive, updating it re-renders) but no consumer
ever reads it. It is almost always a copy-paste slip: a second field was
duplicated from the first and its context reference was never changed.

- Contexts are compared by the source text of the reference, so `contexts.board`
  and `boardContext` are treated as different even if they resolve to the same
  object.
- Providing a context and also consuming it on the same class is allowed; that
  is a legitimate way to re-provide a value from an ancestor.
- The first `@provide` is left alone and every later one is reported.

Examples of **incorrect** code for this rule:

```ts
class Layout extends LitElement {
  @provide({ context: boardContext })
  accessor board = EMPTY_BOARD_CONTEXT;

  @provide({ context: boardContext })
  accessor alsoBoard = EMPTY_BOARD_CONTEXT;
}
```

Examples of **correct** code for this rule:

```ts
class Layout extends LitElement {
  @provide({ context: boardContext })
  accessor board = EMPTY_BOARD_CONTEXT;

  @provide({ context: appDialogContext })
  accessor dialog = EMPTY_APP_DIALOG_CONTEXT;
}
```

## When Not To Use It

There is no reason to provide one context twice from one element, so keep it on.
