# lit-robust/host-constructor

📝 Require a reactive controller constructor to be exactly `constructor(host: ReactiveControllerHost)`.

💼 This rule is enabled in the 🔄 `reactive-controller` [config](https://github.com/cunarist/eslint-plugin-lit-robust#configs-and-rules).

💡 This rule is manually fixable by [editor suggestions](https://eslint.org/docs/latest/use/core-concepts#rule-suggestions).

<!-- end auto-generated rule header -->

## Rule Details

A reactive controller receives its host and nothing else. Extra constructor
parameters capture state at construction time, before the host has ever
rendered, so the controller works from a snapshot that never updates. An
optional or untyped `host` means the controller may be built with no host at
all, in which case registration never happens and the lifecycle hooks never
fire. Everything else the controller needs is handed over afterwards by the
host.

- Only classes that declare `implements ReactiveController` are checked, and
  never a Lit component.
- Each signature problem is reported on its own: no constructor at all, a
  parameter count other than one, a parameter not named `host`, an optional
  `host?`, and a `host` whose type annotation is missing or is not
  `ReactiveControllerHost`.
- An optional `host?` comes with a suggestion to make it required.
- Only the signature is checked, not where the host is stored. Store it under
  any name, or store nothing: a controller that only calls
  `host.addController(this)` needs no field. Sibling rules find the host by
  its type, whatever the field is called.

Examples of **incorrect** code for this rule:

```ts
class BarController implements ReactiveController {
  constructor(host: ReactiveControllerHost, count: number) {}
}
```

Examples of **correct** code for this rule:

```ts
class BarController implements ReactiveController {
  constructor(host: ReactiveControllerHost) {
    host.addController(this);
  }
}
```

## When Not To Use It

If your controllers take configuration through their constructor, turn this
rule off.
