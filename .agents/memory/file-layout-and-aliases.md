---
description: Flat src/rules/<rule-id>.ts with colocated tests and one registry, configs as rule-id lists, regression tests in tests/, # subpath imports
---

**Everything under `src/` is named in kebab-case**, so a file name is the rule
id it implements — `no-unsafe-html` is in `no-unsafe-html.ts`, tested in
`no-unsafe-html.test.ts`, and documented in `docs/rules/no-unsafe-html.md`
(the ESLint plugin convention, which `meta.docs.url` links to). No translation
step sits between the diagnostic a user sees and the file they open.

    src/index.ts                         the plugin, its meta, and its configs
    src/rules/index.ts                   the registry: every rule by id
    src/rules/no-unsafe-html.ts          exports noUnsafeHtmlRule
    src/rules/no-unsafe-html.test.ts     one testRule call
    docs/rules/no-unsafe-html.md         the rule's docs page
    tests/configs.test.ts                a regression test

**Rules sit flat in `src/rules/`**, with no folder per preset, because a rule
can belong to more than one config. A config is only a list of rule ids, kept
in `src/index.ts`; `all` is built from the registry, so a new rule joins it by
itself. Each rule file has one named export with a `Rule` suffix
(`noUnsafeHtmlRule`); the only default export in the package is the plugin.
This layout is the template for every cunarist plugin repo.

Every directory's entry file is `index.ts`, the Node convention. `src/index.ts`
is the only package entry; `src/rules/index.ts` exports the rule `Map` and
nothing else. Tests sit beside the rule: the package publishes only `dist/`, so
colocation costs nothing in the tarball, and Vitest's default include finds
`*.test.ts` without config.

**Unit tests sit next to the code as `*.test.ts`; regression and integration
tests go in the top-level `tests/` folder** and use only the public entry, the
plugin's default export, imported as `#plugin` (`./src/index.ts`). CI runs them
with `vp test tests`, since the other test steps filter by rule tester.

**Shared code is imported through `#` subpath imports**, never a relative path
out of a directory:

```ts
import { isLitComponent } from "#helpers";
import { spanOf, testRule } from "#testing";
```

The aliases are `package.json` `imports`, which Node, TypeScript, Vite, and
Oxlint's plugin loader all resolve natively, so the source runs unbuilt. They
point at `.ts` files and never reach consumers: `vp pack` inlines them.
`#testing` is kept apart from `#helpers` so neither tester lands in a bundle.
There is no `#package` alias: source imports only `.ts` files, so `meta.name`
and `meta.version` are written out in `src/index.ts`. A release bumps them with
`package.json`; `tests/package-meta.test.ts` reads `package.json` with
`node:fs` and fails if they drift.
