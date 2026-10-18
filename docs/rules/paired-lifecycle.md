# lit-robust/paired-lifecycle

📝 Require a reactive controller to define both `hostConnected` and `hostDisconnected`, or neither.

💼 This rule is enabled in the 🔄 `reactive-controller` [config](https://github.com/cunarist/eslint-plugin-lit-robust#configs-and-rules).

<!-- end auto-generated rule header -->

## Rule Details

The pair is what makes a controller worth extracting: acquisition and release
sit in one file, next to each other, and cannot drift apart. Whatever
`hostConnected` starts, a `document` listener, a subscription, an observer,
`hostDisconnected` has to stop. A controller with only `hostConnected` leaks
that resource every time its host is detached and re-attached, and the leak
compounds silently.

- Defining neither hook is fine: a controller that owns no resource needs no
  teardown. Only defining exactly one is reported, at its name.
- Both method syntax and arrow-function fields count, so
  `hostConnected = (): void => {}` satisfies the rule. Static members do not.
- Only classes that declare `implements ReactiveController` are checked, and
  never a Lit component.

Examples of **incorrect** code for this rule:

```ts
class BarController implements ReactiveController {
  hostConnected(): void {}
}
```

Examples of **correct** code for this rule:

```ts
class BarController implements ReactiveController {
  constructor(host: ReactiveControllerHost) {
    host.addController(this);
  }

  hostConnected(): void {}
  hostDisconnected(): void {}
}
```

## When Not To Use It

If you have controllers whose connect work needs no teardown, turn this rule
off.
