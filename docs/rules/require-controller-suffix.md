# @cunarist/lit/require-controller-suffix

📝 Require reactive controller class names to end in `Controller`.

💼 This rule is enabled in the 🔤 `naming` [config](https://github.com/cunarist/eslint-plugin-lit#configs-and-rules).

<!-- end auto-generated rule header -->

## Rule Details

This rule requires a reactive controller class name to end in `Controller`.

The call site is where the name earns its keep.
`#items = new ItemsController(this)` says which collaborator drives updates;
`new Items(this)` reads like a value.

- Controllers are identified by `implements ReactiveController`, never by their
  name; that is the point. A class without the clause is not checked.
- A class that is itself a Lit component is not checked.

Examples of **incorrect** code for this rule:

```ts
class Items implements ReactiveController {}
```

Examples of **correct** code for this rule:

```ts
class ItemsController implements ReactiveController {
  constructor(host: ReactiveControllerHost) {
    host.addController(this);
  }
}
```

## When Not To Use It

This is a naming preference. Nothing else in this package reads the class name,
so turning the rule off costs no coverage elsewhere.
