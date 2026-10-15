# Rules

Every rule of `@cunarist/eslint-plugin-lit`, with the configs that turn it on.
The configs are described in the [README](../../README.md#configs-and-rules).

<!-- prettier-ignore-start -->
<!-- begin auto-generated rules list -->

💼 [Configurations](https://github.com/cunarist/eslint-plugin-lit#configs-and-rules) enabled in.\
🧩 Set in the `core` [configuration](https://github.com/cunarist/eslint-plugin-lit#configs-and-rules).\
🔗 Set in the `dom-ref` [configuration](https://github.com/cunarist/eslint-plugin-lit#configs-and-rules).\
🔤 Set in the `naming` [configuration](https://github.com/cunarist/eslint-plugin-lit#configs-and-rules).\
🔄 Set in the `reactive-controller` [configuration](https://github.com/cunarist/eslint-plugin-lit#configs-and-rules).\
🔒 Set in the `strict` [configuration](https://github.com/cunarist/eslint-plugin-lit#configs-and-rules).

| Name                                                                                | Description                                                                                                | 💼 |
| :---------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------- | :- |
| [attribute-names](attribute-names.md)                                               | Require an explicit `attribute` option on camelCase reactive properties                                    | 🔤 |
| [attribute-value-entities](attribute-value-entities.md)                             | Require HTML entities for `&`, `<`, `>`, and `"` in template attribute values                              | 🧩 |
| [binding-positions](binding-positions.md)                                           | Disallow bindings in tag names, closing tags, and attribute names                                          | 🧩 |
| [composed-requires-bubbles](composed-requires-bubbles.md)                           | Require `bubbles: true` on events constructed with `composed: true`                                        | 🧩 |
| [directive-allowlist](directive-allowlist.md)                                       | Disallow Lit directive imports other than `ref` and `repeat`                                               | 🔒 |
| [event-name-case](event-name-case.md)                                               | Require kebab-case names for events created with `new CustomEvent()` or `new Event()`                      | 🔤 |
| [host-constructor](host-constructor.md)                                             | Require a reactive controller constructor to be exactly `constructor(host: ReactiveControllerHost)`        | 🔄 |
| [lifecycle-allowlist](lifecycle-allowlist.md)                                       | Disallow Lit component lifecycle overrides other than `styles` and `render`                                | 🔄 |
| [lifecycle-super](lifecycle-super.md)                                               | Require Lit lifecycle overrides to call their `super` implementation                                       | 🧩 |
| [no-array-mutation-without-reassign](no-array-mutation-without-reassign.md)         | Disallow mutating array methods on reactive properties                                                     | 🧩 |
| [no-async-lifecycle](no-async-lifecycle.md)                                         | Disallow `async` Lit lifecycle hooks                                                                       | 🧩 |
| [no-async-render](no-async-render.md)                                               | Disallow an `async` `render()` on Lit components                                                           | 🧩 |
| [no-attribute-property-binding-conflict](no-attribute-property-binding-conflict.md) | Disallow binding one name as both an attribute and a property on an element                                | 🧩 |
| [no-boolean-property-default-true](no-boolean-property-default-true.md)             | Disallow a `type: Boolean` reactive property whose default is not literal `false`                          | 🔒 |
| [no-camelcase-attribute](no-camelcase-attribute.md)                                 | Disallow uppercase letters and underscores in `html` template attribute names                              | 🔤 |
| [no-classfield-shadowing](no-classfield-shadowing.md)                               | Disallow class fields that shadow reactive properties                                                      | 🧩 |
| [no-component-disposables](no-component-disposables.md)                             | Disallow creating disposable resources and listeners inside a Lit component                                | 🔄 |
| [no-context-mutation-by-consumer](no-context-mutation-by-consumer.md)               | Disallow assigning to fields declared with `@consume`                                                      | 🧩 |
| [no-dispatch-in-render](no-dispatch-in-render.md)                                   | Disallow dispatching events from `render()`                                                                | 🧩 |
| [no-dom-query](no-dom-query.md)                                                     | Disallow `querySelector` and `querySelectorAll` inside a Lit component                                     | 🔗 |
| [no-duplicate-context-provider](no-duplicate-context-provider.md)                   | Disallow providing the same context twice from one class                                                   | 🧩 |
| [no-duplicate-property-declaration](no-duplicate-property-declaration.md)           | Disallow declaring a reactive property both by decorator and in `static properties`                        | 🧩 |
| [no-duplicate-slot-names](no-duplicate-slot-names.md)                               | Disallow two slots with the same name in one template                                                      | 🧩 |
| [no-duplicate-tag-registration](no-duplicate-tag-registration.md)                   | Disallow registering the same custom element tag twice in one file                                         | 🧩 |
| [no-duplicate-template-bindings](no-duplicate-template-bindings.md)                 | Disallow binding the same attribute, property, or event twice on one element                               | 🧩 |
| [no-event-target-subclass](no-event-target-subclass.md)                             | Disallow classes that extend `EventTarget`                                                                 | 🔒 |
| [no-fetch-in-component](no-fetch-in-component.md)                                   | Disallow calling `fetch` inside a Lit component                                                            | 🔄 |
| [no-index-as-repeat-key](no-index-as-repeat-key.md)                                 | Disallow `repeat` key functions that return the item index                                                 | 🧩 |
| [no-inline-event-attribute](no-inline-event-attribute.md)                           | Disallow inline event handler attributes in templates                                                      | 🧩 |
| [no-inner-html-assignment](no-inner-html-assignment.md)                             | Disallow assigning to `innerHTML` or `outerHTML`                                                           | 🧩 |
| [no-invalid-escape-sequences](no-invalid-escape-sequences.md)                       | Disallow malformed `\x` and `\u` escapes in templates                                                      | 🧩 |
| [no-invalid-html](no-invalid-html.md)                                               | Disallow template markup that is not valid HTML                                                            | 🧩 |
| [no-jsx-attribute-names](no-jsx-attribute-names.md)                                 | Disallow the JSX attribute names `className` and `htmlFor` in templates                                    | 🧩 |
| [no-legacy-imports](no-legacy-imports.md)                                           | Disallow Lit 1 module paths and the names Lit 2 removed                                                    | 🧩 |
| [no-legacy-template-syntax](no-legacy-template-syntax.md)                           | Disallow Polymer-style `[[…]]` and `{{…}}` bindings in templates                                           | 🧩 |
| [no-light-dom](no-light-dom.md)                                                     | Disallow `createRenderRoot()` returning `this` in a Lit component                                          | 🔒 |
| [no-manual-update](no-manual-update.md)                                             | Disallow a Lit component scheduling its own updates                                                        | 🔒 |
| [no-multiple-default-slots](no-multiple-default-slots.md)                           | Disallow more than one default `<slot>` in a template                                                      | 🧩 |
| [no-native-attributes](no-native-attributes.md)                                     | Disallow reactive properties named after global HTML attributes                                            | 🧩 |
| [no-partial-property-binding](no-partial-property-binding.md)                       | Disallow property, event, and boolean bindings that are not the whole attribute value                      | 🧩 |
| [no-private-properties](no-private-properties.md)                                   | Disallow declaring a private field as a public reactive property                                           | 🧩 |
| [no-property-assignment-in-constructor](no-property-assignment-in-constructor.md)   | Disallow assigning a reactive property in the constructor                                                  | 🔒 |
| [no-property-change-in-updated](no-property-change-in-updated.md)                   | Disallow changing a reactive property in `updated()` or `firstUpdated()`                                   | 🧩 |
| [no-property-change-update](no-property-change-update.md)                           | Disallow changing a reactive property in `update()`                                                        | 🧩 |
| [no-property-named-like-lifecycle](no-property-named-like-lifecycle.md)             | Disallow fields and reactive properties named after Lit lifecycle members                                  | 🧩 |
| [no-query-decorators](no-query-decorators.md)                                       | Disallow the Lit `@query` decorators and their imports                                                     | 🔗 |
| [no-request-update-in-updated](no-request-update-in-updated.md)                     | Disallow calling `requestUpdate()` in `updated()` or `firstUpdated()`                                      | 🧩 |
| [no-script-in-template](no-script-in-template.md)                                   | Disallow `<script>` elements in templates                                                                  | 🧩 |
| [no-self-closing-non-void](no-self-closing-non-void.md)                             | Disallow self-closing syntax on non-void HTML elements in templates                                        | 🧩 |
| [no-string-context-key](no-string-context-key.md)                                   | Disallow a string literal as a `createContext()` key                                                       | 🔒 |
| [no-this-assign-in-render](no-this-assign-in-render.md)                             | Disallow assigning to `this` or its members inside `render()`                                              | 🧩 |
| [no-this-in-static-styles](no-this-in-static-styles.md)                             | Disallow `this` inside `static styles`                                                                     | 🧩 |
| [no-timers](no-timers.md)                                                           | Disallow `setTimeout`, `setInterval`, `requestAnimationFrame`, and `queueMicrotask` inside a Lit component | 🔄 |
| [no-unsafe-css](no-unsafe-css.md)                                                   | Disallow `unsafeCSS` from Lit                                                                              | 🧩 |
| [no-unsafe-html](no-unsafe-html.md)                                                 | Disallow the `unsafeHTML` and `unsafeSVG` directives                                                       | 🧩 |
| [no-update-complete](no-update-complete.md)                                         | Disallow accessing `updateComplete`                                                                        | 🔒 |
| [no-useless-template-literals](no-useless-template-literals.md)                     | Disallow an `html` template that holds only a single binding                                               | 🧩 |
| [no-value-attribute](no-value-attribute.md)                                         | Disallow a bound `value` attribute on a form control                                                       | 🧩 |
| [paired-lifecycle](paired-lifecycle.md)                                             | Require a reactive controller to define both `hostConnected` and `hostDisconnected`, or neither            | 🔄 |
| [prefer-context-decorators](prefer-context-decorators.md)                           | Enforce `@provide` and `@consume` over constructing `ContextProvider` or `ContextConsumer`                 | 🔒 |
| [prefer-create-ref](prefer-create-ref.md)                                           | Enforce `createRef` over a `ref` callback that only stashes the element                                    | 🔗 |
| [prefer-decorators](prefer-decorators.md)                                           | Enforce `@property` and `@state` decorators over `static properties`                                       | 🔒 |
| [prefer-static-styles](prefer-static-styles.md)                                     | Enforce `static styles` over `<style>` elements in templates                                               | 🧩 |
| [require-accessor-with-decorators](require-accessor-with-decorators.md)             | Require `accessor` on fields decorated with `@property` or `@state`                                        | 🧩 |
| [require-context-type](require-context-type.md)                                     | Require an explicit type argument on `createContext()`                                                     | 🧩 |
| [require-controller-suffix](require-controller-suffix.md)                           | Require reactive controller class names to end in `Controller`                                             | 🔤 |
| [require-custom-element-registration](require-custom-element-registration.md)       | Require every Lit component in a file to be registered as a custom element                                 | 🔒 |
| [require-dashed-tag](require-dashed-tag.md)                                         | Require custom element names that the registry accepts                                                     | 🧩 |
| [require-direct-registration-import](require-direct-registration-import.md)         | Require importing the module that registers each custom element a template uses                            | 🧩 |
| [require-dispatch-on-this](require-dispatch-on-this.md)                             | Require a component's events to be dispatched on the component itself                                      | 🧩 |
| [require-element-suffix](require-element-suffix.md)                                 | Require registered component class names to end in `Element`                                               | 🔤 |
| [require-event-in-event-map](require-event-in-event-map.md)                         | Require an `HTMLElementEventMap` entry for every event a Lit component constructs                          | 🔒 |
| [require-property-type](require-property-type.md)                                   | Require a `type` on every `@property` that has an attribute                                                | 🧩 |
| [require-repeat-key](require-repeat-key.md)                                         | Require a key function in `repeat()`                                                                       | 🧩 |
| [require-scalar-reflect](require-scalar-reflect.md)                                 | Require reflected properties to declare a scalar type                                                      | 🧩 |
| [require-tag-name-map](require-tag-name-map.md)                                     | Require an `HTMLElementTagNameMap` entry for every `@customElement` registration                           | 🔒 |
| [require-tag-prefix](require-tag-prefix.md)                                         | Require a namespace prefix in custom element names                                                         | 🔤 |
| [self-registration](self-registration.md)                                           | Require a reactive controller to call `host.addController(this)` in its constructor                        | 🔄 |
| [simple-template-expressions](simple-template-expressions.md)                       | Enforce plain names and member chains as template bindings                                                 | 🧩 |
| [svg-template-for-svg-content](svg-template-for-svg-content.md)                     | Require SVG-only elements to sit in an `svg` template or an `<svg>` element                                | 🧩 |
| [tag-matches-class-name](tag-matches-class-name.md)                                 | Require a `@customElement` tag to name its class                                                           | 🔤 |
| [value-after-constraints](value-after-constraints.md)                               | Enforce setting `value` after every validity constraint attribute                                          | 🧩 |

<!-- end auto-generated rules list -->
<!-- prettier-ignore-end -->
