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
🔤 Set in the `naming` [configuration](https://github.com/cunarist/eslint-plugin-lit#configs-and-rules).\
🔄 Set in the `reactive-controller` [configuration](https://github.com/cunarist/eslint-plugin-lit#configs-and-rules).\
🔒 Set in the `strict` [configuration](https://github.com/cunarist/eslint-plugin-lit#configs-and-rules).

| Name                                                                                         | Description                                                                                                | 💼 |
| :------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------- | :- |
| [attribute-names](docs/rules/attribute-names.md)                                             | Require an explicit `attribute` option on camelCase reactive properties                                    | 🔤 |
| [directive-allowlist](docs/rules/directive-allowlist.md)                                     | Disallow Lit directive imports other than `ref` and `repeat`                                               | 🔒 |
| [event-name-case](docs/rules/event-name-case.md)                                             | Require kebab-case names for events created with `new CustomEvent()` or `new Event()`                      | 🔤 |
| [host-constructor](docs/rules/host-constructor.md)                                           | Require a reactive controller constructor to be exactly `constructor(host: ReactiveControllerHost)`        | 🔄 |
| [lifecycle-allowlist](docs/rules/lifecycle-allowlist.md)                                     | Disallow Lit component lifecycle overrides other than `styles` and `render`                                | 🔄 |
| [no-boolean-property-default-true](docs/rules/no-boolean-property-default-true.md)           | Disallow a `type: Boolean` reactive property whose default is not literal `false`                          | 🔒 |
| [no-camelcase-attribute](docs/rules/no-camelcase-attribute.md)                               | Disallow uppercase letters and underscores in `html` template attribute names                              | 🔤 |
| [no-component-disposables](docs/rules/no-component-disposables.md)                           | Disallow creating disposable resources and listeners inside a Lit component                                | 🔄 |
| [no-dom-query](docs/rules/no-dom-query.md)                                                   | Disallow `querySelector` and `querySelectorAll` inside a Lit component                                     | 🔗 |
| [no-event-target-subclass](docs/rules/no-event-target-subclass.md)                           | Disallow classes that extend `EventTarget`                                                                 | 🔒 |
| [no-fetch-in-component](docs/rules/no-fetch-in-component.md)                                 | Disallow calling `fetch` inside a Lit component                                                            | 🔄 |
| [no-inner-html-assignment](docs/rules/no-inner-html-assignment.md)                           | Disallow assigning to `innerHTML` or `outerHTML`                                                           | 🧩 |
| [no-invalid-escape-sequences](docs/rules/no-invalid-escape-sequences.md)                     | Disallow malformed `\x` and `\u` escapes in templates                                                      | 🧩 |
| [no-invalid-html](docs/rules/no-invalid-html.md)                                             | Disallow template markup that is not valid HTML                                                            | 🧩 |
| [no-jsx-attribute-names](docs/rules/no-jsx-attribute-names.md)                               | Disallow the JSX attribute names `className` and `htmlFor` in templates                                    | 🧩 |
| [no-legacy-imports](docs/rules/no-legacy-imports.md)                                         | Disallow Lit 1 module paths and the names Lit 2 removed                                                    | 🧩 |
| [no-legacy-template-syntax](docs/rules/no-legacy-template-syntax.md)                         | Disallow Polymer-style `[[…]]` and `{{…}}` bindings in templates                                           | 🧩 |
| [no-light-dom](docs/rules/no-light-dom.md)                                                   | Disallow `createRenderRoot()` returning `this` in a Lit component                                          | 🔒 |
| [no-manual-update](docs/rules/no-manual-update.md)                                           | Disallow a Lit component scheduling its own updates                                                        | 🔒 |
| [no-multiple-default-slots](docs/rules/no-multiple-default-slots.md)                         | Disallow more than one default `<slot>` in a template                                                      | 🧩 |
| [no-native-attributes](docs/rules/no-native-attributes.md)                                   | Disallow reactive properties named after global HTML attributes                                            | 🧩 |
| [no-partial-property-binding](docs/rules/no-partial-property-binding.md)                     | Disallow property, event, and boolean bindings that are not the whole attribute value                      | 🧩 |
| [no-private-properties](docs/rules/no-private-properties.md)                                 | Disallow declaring a private field as a public reactive property                                           | 🧩 |
| [no-property-assignment-in-constructor](docs/rules/no-property-assignment-in-constructor.md) | Disallow assigning a reactive property in the constructor                                                  | 🔒 |
| [no-property-change-in-updated](docs/rules/no-property-change-in-updated.md)                 | Disallow changing a reactive property in `updated()` or `firstUpdated()`                                   | 🧩 |
| [no-property-change-update](docs/rules/no-property-change-update.md)                         | Disallow changing a reactive property in `update()`                                                        | 🧩 |
| [no-property-named-like-lifecycle](docs/rules/no-property-named-like-lifecycle.md)           | Disallow fields and reactive properties named after Lit lifecycle members                                  | 🧩 |
| [no-query-decorators](docs/rules/no-query-decorators.md)                                     | Disallow the Lit `@query` decorators and their imports                                                     | 🔗 |
| [no-request-update-in-updated](docs/rules/no-request-update-in-updated.md)                   | Disallow calling `requestUpdate()` in `updated()` or `firstUpdated()`                                      | 🧩 |
| [no-script-in-template](docs/rules/no-script-in-template.md)                                 | Disallow `<script>` elements in templates                                                                  | 🧩 |
| [no-self-closing-non-void](docs/rules/no-self-closing-non-void.md)                           | Disallow self-closing syntax on non-void HTML elements in templates                                        | 🧩 |
| [no-string-context-key](docs/rules/no-string-context-key.md)                                 | Disallow a string literal as a `createContext()` key                                                       | 🔒 |
| [no-this-assign-in-render](docs/rules/no-this-assign-in-render.md)                           | Disallow assigning to `this` or its members inside `render()`                                              | 🧩 |
| [no-this-in-static-styles](docs/rules/no-this-in-static-styles.md)                           | Disallow `this` inside `static styles`                                                                     | 🧩 |
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
| [require-controller-suffix](docs/rules/require-controller-suffix.md)                         | Require reactive controller class names to end in `Controller`                                             | 🔤 |
| [require-custom-element-registration](docs/rules/require-custom-element-registration.md)     | Require every Lit component in a file to be registered as a custom element                                 | 🔒 |
| [require-dashed-tag](docs/rules/require-dashed-tag.md)                                       | Require custom element names that the registry accepts                                                     | 🧩 |
| [require-direct-registration-import](docs/rules/require-direct-registration-import.md)       | Require importing the module that registers each custom element a template uses                            | 🧩 |
| [require-dispatch-on-this](docs/rules/require-dispatch-on-this.md)                           | Require a component's events to be dispatched on the component itself                                      | 🧩 |
| [require-element-suffix](docs/rules/require-element-suffix.md)                               | Require registered component class names to end in `Element`                                               | 🔤 |
| [require-event-in-event-map](docs/rules/require-event-in-event-map.md)                       | Require an `HTMLElementEventMap` entry for every event a Lit component constructs                          | 🔒 |
| [require-property-type](docs/rules/require-property-type.md)                                 | Require a `type` on every `@property` that has an attribute                                                | 🧩 |
| [require-repeat-key](docs/rules/require-repeat-key.md)                                       | Require a key function in `repeat()`                                                                       | 🧩 |
| [require-scalar-reflect](docs/rules/require-scalar-reflect.md)                               | Require reflected properties to declare a scalar type                                                      | 🧩 |
| [require-tag-name-map](docs/rules/require-tag-name-map.md)                                   | Require an `HTMLElementTagNameMap` entry for every `@customElement` registration                           | 🔒 |
| [require-tag-prefix](docs/rules/require-tag-prefix.md)                                       | Require a namespace prefix in custom element names                                                         | 🔤 |
| [self-registration](docs/rules/self-registration.md)                                         | Require a reactive controller to call `host.addController(this)` in its constructor                        | 🔄 |
| [simple-template-expressions](docs/rules/simple-template-expressions.md)                     | Enforce plain names and member chains as template bindings                                                 | 🧩 |
| [svg-template-for-svg-content](docs/rules/svg-template-for-svg-content.md)                   | Require SVG-only elements to sit in an `svg` template or an `<svg>` element                                | 🧩 |
| [tag-matches-class-name](docs/rules/tag-matches-class-name.md)                               | Require a `@customElement` tag to name its class                                                           | 🔤 |
| [value-after-constraints](docs/rules/value-after-constraints.md)                             | Enforce setting `value` after every validity constraint attribute                                          | 🧩 |

<!-- end auto-generated rules list -->
<!-- prettier-ignore-end -->

License: MIT.
