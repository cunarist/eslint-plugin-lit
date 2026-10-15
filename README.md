# eslint-plugin-lit

[Lit](https://lit.dev) web component rules for both [ESLint](https://eslint.org) and [Oxlint](https://oxc.rs/docs/guide/usage/linter): they catch the Lit mistakes that still compile.\
Install with `npm install --save-dev @cunarist/eslint-plugin-lit`. Requires Node.js 22+.

```ts
// Oxlint, through Vite+: vite.config.ts
import plugin from "@cunarist/eslint-plugin-lit";
import { defineConfig } from "vite-plus";
const rules = { ...plugin.configs.core.rules };
export default defineConfig({ lint: { jsPlugins: [plugin.meta.name], rules } });
```

```ts
// ESLint 9: eslint.config.ts (loading a .ts config needs jiti)
import plugin from "@cunarist/eslint-plugin-lit";
import { parser } from "typescript-eslint";
const ts = { files: ["**/*.ts"], languageOptions: { parser } };
export default [ts, plugin.configs.core];
```

The rules assume standard decorators, not `experimentalDecorators`. They follow
imports into other files and packages to tell Lit's `LitElement` and `html`
from look-alikes, so `lit` must be installed where the linted code is.

## Configs and rules

- `core`: Lit code that does not do what it looks like it does.
- `strict`: demanding, but correct.
- `dom-ref`: reach the DOM through a `createRef` ref, nothing else.
- `reactive-controller`: anything with a lifetime belongs in a controller.
- `naming`: what elements, controllers, attributes, and events are called.
- `all`: every rule, including ones added later. Rules take no options.

<!-- prettier-ignore-start -->
<!-- begin auto-generated rules list -->

💼 [Configurations](https://github.com/cunarist/eslint-plugin-lit#configs-and-rules) enabled in.\
🔗 Set in the `dom-ref` [configuration](https://github.com/cunarist/eslint-plugin-lit#configs-and-rules).\
🔄 Set in the `reactive-controller` [configuration](https://github.com/cunarist/eslint-plugin-lit#configs-and-rules).\
🔒 Set in the `strict` [configuration](https://github.com/cunarist/eslint-plugin-lit#configs-and-rules).

| Name                                                                                         | Description                                                                                                | 💼 |
| :------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------- | :- |
| [directive-allowlist](docs/rules/directive-allowlist.md)                                     | Disallow Lit directive imports other than `ref` and `repeat`                                               | 🔒 |
| [host-constructor](docs/rules/host-constructor.md)                                           | Require a reactive controller constructor to be exactly `constructor(host: ReactiveControllerHost)`        | 🔄 |
| [lifecycle-allowlist](docs/rules/lifecycle-allowlist.md)                                     | Disallow Lit component lifecycle overrides other than `styles` and `render`                                | 🔄 |
| [no-boolean-property-default-true](docs/rules/no-boolean-property-default-true.md)           | Disallow a `type: Boolean` reactive property whose default is not literal `false`                          | 🔒 |
| [no-component-disposables](docs/rules/no-component-disposables.md)                           | Disallow creating disposable resources and listeners inside a Lit component                                | 🔄 |
| [no-dom-query](docs/rules/no-dom-query.md)                                                   | Disallow `querySelector` and `querySelectorAll` inside a Lit component                                     | 🔗 |
| [no-event-target-subclass](docs/rules/no-event-target-subclass.md)                           | Disallow classes that extend `EventTarget`                                                                 | 🔒 |
| [no-fetch-in-component](docs/rules/no-fetch-in-component.md)                                 | Disallow calling `fetch` inside a Lit component                                                            | 🔄 |
| [no-light-dom](docs/rules/no-light-dom.md)                                                   | Disallow `createRenderRoot()` returning `this` in a Lit component                                          | 🔒 |
| [no-manual-update](docs/rules/no-manual-update.md)                                           | Disallow a Lit component scheduling its own updates                                                        | 🔒 |
| [no-property-assignment-in-constructor](docs/rules/no-property-assignment-in-constructor.md) | Disallow assigning a reactive property in the constructor                                                  | 🔒 |
| [no-query-decorators](docs/rules/no-query-decorators.md)                                     | Disallow the Lit `@query` decorators and their imports                                                     | 🔗 |
| [no-string-context-key](docs/rules/no-string-context-key.md)                                 | Disallow a string literal as a `createContext()` key                                                       | 🔒 |
| [no-timers](docs/rules/no-timers.md)                                                         | Disallow `setTimeout`, `setInterval`, `requestAnimationFrame`, and `queueMicrotask` inside a Lit component | 🔄 |
| [no-update-complete](docs/rules/no-update-complete.md)                                       | Disallow accessing `updateComplete`                                                                        | 🔒 |
| [paired-lifecycle](docs/rules/paired-lifecycle.md)                                           | Require a reactive controller to define both `hostConnected` and `hostDisconnected`, or neither            | 🔄 |
| [prefer-context-decorators](docs/rules/prefer-context-decorators.md)                         | Enforce `@provide` and `@consume` over constructing `ContextProvider` or `ContextConsumer`                 | 🔒 |
| [prefer-create-ref](docs/rules/prefer-create-ref.md)                                         | Enforce `createRef` over a `ref` callback that only stashes the element                                    | 🔗 |
| [prefer-decorators](docs/rules/prefer-decorators.md)                                         | Enforce `@property` and `@state` decorators over `static properties`                                       | 🔒 |
| [require-custom-element-registration](docs/rules/require-custom-element-registration.md)     | Require every Lit component in a file to be registered as a custom element                                 | 🔒 |
| [require-event-in-event-map](docs/rules/require-event-in-event-map.md)                       | Require an `HTMLElementEventMap` entry for every event a Lit component constructs                          | 🔒 |
| [require-tag-name-map](docs/rules/require-tag-name-map.md)                                   | Require an `HTMLElementTagNameMap` entry for every `@customElement` registration                           | 🔒 |
| [self-registration](docs/rules/self-registration.md)                                         | Require a reactive controller to call `host.addController(this)` in its constructor                        | 🔄 |

<!-- end auto-generated rules list -->
<!-- prettier-ignore-end -->

License: MIT.
