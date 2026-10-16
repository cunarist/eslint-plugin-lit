# @cunarist/lit/self-registration

📝 Require a reactive controller to call `host.addController(this)` in its constructor.

💼 This rule is enabled in the 🔄 `reactive-controller` [config](https://github.com/cunarist/eslint-plugin-lit#configs-and-rules).

💡 This rule is manually fixable by [editor suggestions](https://eslint.org/docs/latest/use/core-concepts#rule-suggestions).

<!-- end auto-generated rule header -->

## Rule Details

A controller registers itself; the host constructs it and forgets about it. If
registration is left to the host, every construction site becomes a place to
forget it, and an unregistered controller is inert: `hostConnected` and
`hostDisconnected` never fire, so setup never runs and cleanup never runs
either. Registering anywhere other than the constructor means the window between
construction and registration can miss a connect.

- Accepted receivers are the host parameter and the field the constructor
  stores it in. Both are found by the `ReactiveControllerHost` type, not by
  name, so `controllerHost.addController(this)` and
  `this._host.addController(this)` count. `host`, `this.host`, and
  `this.#host` are always accepted.
- The argument must be exactly `this`: `host.addController(other)` does not
  count, and neither does a registration made from `hostConnected` or any
  other method.
- When the constructor has a `ReactiveControllerHost` parameter, a suggestion
  appends the registration to the constructor body.
- Only classes that declare `implements ReactiveController` are checked, and
  never a Lit component.

Examples of **incorrect** code for this rule:

```ts
class BarController implements ReactiveController {
  constructor(host: ReactiveControllerHost) {}
}
```

Examples of **correct** code for this rule:

```ts
class BarController implements ReactiveController {
  #host: ReactiveControllerHost;
  constructor(host: ReactiveControllerHost) {
    this.#host = host;
    this.#host.addController(this);
  }
}
```

## When Not To Use It

If your hosts register the controllers they construct, turn this rule off.
