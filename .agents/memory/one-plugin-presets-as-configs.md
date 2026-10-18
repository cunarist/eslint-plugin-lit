---
description: One plugin, namespace lit-robust, default export only; Deno's five plugins survive as plugin.configs, plus all
---

The shared shape (default export only, `all`, no `recommended`) is in
[[plugin-exports-and-configs]]; this note is lit's mapping.

ESLint's convention is one plugin per package, named from the package:
`eslint-plugin-lit-robust` becomes the namespace `lit-robust`. Oxlint
normalizes `meta.name` the same way, so a rule id is
`lit-robust/no-unsafe-html` under both. Deno's ids were
`lit-core/no-unsafe-html` and so on; the rule names themselves are unchanged.

The Deno package was five plugins, `lit-core`, `lit-strict`, `lit-dom-ref`,
`lit-reactive-controller`, and `lit-naming`, one per entry point, because
Deno's plugin API had no presets. Those survive as flat configs at
`plugin.configs.core`, `.strict`, `["dom-ref"]`, `["reactive-controller"]`, and
`.naming`, plus `.all` with every rule. Each config is a list of rule ids in
`src/plugin/index.ts`; `all` is built from the rule registry in `src/rules/index.ts`,
so a new rule joins it without an edit. `tests/configs.test.ts` pins the Deno
groups (52, 13, 3, 7, 7 rules) and checks that each config holds exactly its
group's ported rules and that `all` is their union. There is no
`recommended` and no `meta.docs.recommended`.

The package has only a default export, the plugin. The Deno package also
exported every rule and each group's record (`coreRules`, ...) and its
`#helpers` for composing custom plugins; none of that is public any more.
ESLint users list `plugin.configs.<name>`; Oxlint, whose plugins turn no rule on
by themselves, spreads `plugin.configs.<name>.rules` next to
`jsPlugins: ["eslint-plugin-lit-robust"]`. In Deno, loading a plugin turned
on every rule in it, which is what a config does now.

**No rule takes settings**, as in Deno: the directive allowlist, tag prefix,
and lifecycle allowlist stay hard-coded. Making them options is a user
decision, not part of the port.
