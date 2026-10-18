---
description: Lit's 82-rule list is generated into the README like the other plugins; config emojis are fixed
---

The generator setup shared by every plugin repo is in
[[plugin-docs-and-readme]]. What differs here:

- The 82-rule list is generated into `README.md`, as in explicit-types and
  modules; it keeps the decorators note between the usage snippets and the
  configs.
- Config emojis: 🧩 core, 🔒 strict, 🔗 dom-ref, 🔄 reactive-controller,
  🔤 naming. Emojis with a U+FE0F variation selector (🏷️, 🕳️) were avoided.
- `urlConfigs` links the configs to the README "Configs and rules" section.
- Rule doc headers are titled `lit-robust/<rule>`. Keep `ts` examples valid
  at top level; wrap a bare `readonly` or `private` modifier in a
  `class … { }` body.
