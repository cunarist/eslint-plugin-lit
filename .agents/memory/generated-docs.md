---
description: README rules list and rule doc headers come from eslint-doc-generator; run vp pack then npm run docs
---

`eslint-doc-generator` (devDependency) loads the built plugin from
`exports` (`dist/index.js`), so `vp pack` must run first. `npm run docs`
rewrites the README rules list and the header of every `docs/rules/*.md` (title
`@cunarist/lit/<rule>`, 📝 description, 💼 configs). CI runs
`npm run docs -- --check` after `vp pack`.

Its options live in the `eslint-doc-generator` key of `package.json`, since
the only config files allowed are `package.json`, `tsconfig.json`, and
`vite.config.ts`. Config emojis: 🧩 core, 🔒 strict, 🔗 dom-ref, 🔄 reactive-controller,
🔤 naming.
`ignoreConfig: ["all"]` keeps `all` out of the tables, since it would mark
every rule. `urlConfigs` links the configs to the README "Configs and rules" section.
`ruleListColumns` keeps only name, description, and 💼. With 82 rules the
generated list alone outgrows the template's 60-line README budget; that is
an open question for the user, not a reason to drop the list. Emojis
carrying a U+FE0F variation selector (🏷️, 🕳️) were avoided because table
padding then never settles.

The README list is wrapped in `<!-- prettier-ignore-start/end -->`: oxfmt
and the generator measure emoji widths differently, so without it `vp fmt` and
`--check` fight over table padding forever.

`ruleDocSectionInclude` enforces Rule Details and When Not To Use It ([[rule-docs-format]]).
The README cannot group the list by preset: `--rule-list-split` splits only by a
rule property, and presets are configs, not rule properties.
