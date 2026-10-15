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
🧩 Set in the `core` [configuration](https://github.com/cunarist/eslint-plugin-lit#configs-and-rules).\
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
| [no-unsafe-css](docs/rules/no-unsafe-css.md)                                                 | Disallow `unsafeCSS` from Lit                                                                              | 🧩 |
| [no-unsafe-html](docs/rules/no-unsafe-html.md)                                               | Disallow the `unsafeHTML` and `unsafeSVG` directives                                                       | 🧩 |
| [no-update-complete](docs/rules/no-update-complete.md)                                       | Disallow accessing `updateComplete`                                                                        | 🔒 |
| [no-useless-template-literals](docs/rules/no-useless-template-literals.md)                   | Disallow an `html` template that holds only a single binding                                               | 🧩 |
| [no-value-attribute](docs/rules/no-value-attribute.md)                                       | Disallow a bound `value` attribute on a form control                                                       | 🧩 |
| [paired-lifecycle](docs/rules/paired-lifecycle.md)                                           | Require a reactive controller to define both `hostConnected` and `hostDisconnected`, or neither            | 🔄 |
| [prefer-context-decorators](docs/rules/prefer-context-decorators.md)                         | Enforce `@provide` and `@consume` over constructing `ContextProvider` or `ContextConsumer`                 | 🔒 |
| [prefer-create-ref](docs/rules/prefer-create-ref.md)                                         | Enforce `createRef` over a `ref` callback that only stashes the element                                    | 🔗 |
| [prefer-decorators](docs/rules/prefer-decorators.md)                                         | Enforce `@property` and `@state` decorators over `static properties`                                       | 🔒 |
| [prefer-static-styles](docs/rules/prefer-static-styles.md)                                   | Enforce `static styles` over `<style>` elements in templates                                               | 🧩 |
| [require-accessor-with-decorators](docs/rules/require-accessor-with-decorators.md)           | Require `accessor` on fields decorated with `@property` or `@state`                                        | 🧩 |
| [require-context-type](docs/rules/require-context-type.md)                                   | Require an explicit type argument on `createContext()`                                                     | 🧩 |
| [require-custom-element-registration](docs/rules/require-custom-element-registration.md)     | Require every Lit component in a file to be registered as a custom element                                 | 🔒 |
| [require-dashed-tag](docs/rules/require-dashed-tag.md)                                       | Require custom element names that the registry accepts                                                     | 🧩 |
| [require-direct-registration-import](docs/rules/require-direct-registration-import.md)       | Require importing the module that registers each custom element a template uses                            | 🧩 |
| [require-dispatch-on-this](docs/rules/require-dispatch-on-this.md)                           | Require a component's events to be dispatched on the component itself                                      | 🧩 |
| [require-event-in-event-map](docs/rules/require-event-in-event-map.md)                       | Require an `HTMLElementEventMap` entry for every event a Lit component constructs                          | 🔒 |
| [require-property-type](docs/rules/require-property-type.md)                                 | Require a `type` on every `@property` that has an attribute                                                | 🧩 |
| [require-repeat-key](docs/rules/require-repeat-key.md)                                       | Require a key function in `repeat()`                                                                       | 🧩 |
| [require-scalar-reflect](docs/rules/require-scalar-reflect.md)                               | Require reflected properties to declare a scalar type                                                      | 🧩 |
| [require-tag-name-map](docs/rules/require-tag-name-map.md)                                   | Require an `HTMLElementTagNameMap` entry for every `@customElement` registration                           | 🔒 |
| [self-registration](docs/rules/self-registration.md)                                         | Require a reactive controller to call `host.addController(this)` in its constructor                        | 🔄 |
| [simple-template-expressions](docs/rules/simple-template-expressions.md)                     | Enforce plain names and member chains as template bindings                                                 | 🧩 |
| [svg-template-for-svg-content](docs/rules/svg-template-for-svg-content.md)                   | Require SVG-only elements to sit in an `svg` template or an `<svg>` element                                | 🧩 |
| [value-after-constraints](docs/rules/value-after-constraints.md)                             | Enforce setting `value` after every validity constraint attribute                                          | 🧩 |

<!-- end auto-generated rules list -->
<!-- prettier-ignore-end -->

License: MIT.
