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

| Name |
| :--- |

<!-- end auto-generated rules list -->
<!-- prettier-ignore-end -->

License: MIT.
