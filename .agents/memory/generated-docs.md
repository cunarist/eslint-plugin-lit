---
description: Lit's 82-rule list is generated into docs/rules/README.md (pathRuleList), not the README; config emojis are fixed
---

The generator setup shared by every plugin repo is in
[[plugin-docs-and-readme]]. What differs here:

- With 82 rules the generated list alone outgrows the 60-line README budget,
  so `pathRuleList` puts it in `docs/rules/README.md` and the README links
  there (a deviation from the template, which lists rules in the README;
  flagged to the user in the morning questions).
- Config emojis: 🧩 core, 🔒 strict, 🔗 dom-ref, 🔄 reactive-controller,
  🔤 naming. Emojis with a U+FE0F variation selector (🏷️, 🕳️) were avoided.
- `urlConfigs` links the configs to the README "Configs and rules" section.
- Rule doc headers are titled `@cunarist/lit/<rule>`. Keep `ts` examples valid
  at top level; wrap a bare `readonly` or `private` modifier in a
  `class … { }` body.
