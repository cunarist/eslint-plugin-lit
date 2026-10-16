---
description: What the Deno plugin was, where its parts went, and what still needs a user decision
---

Source: `cunarist/deno-lint-plugin-lit` 0.7.1 (82 rules, five plugins), which
stays as is and is archived only after this package is published. The plan is
`~/.local/share/deno-migration/migration-plans/lit.md`. The port happens in
three steps on one PR branch: the scaffold (configs, CI, `#helpers`,
`#testing`, empty registry), then the rules group by group, each with its
tests and `docs/rules/<id>.md` ported from the Deno `.md` and `tests/*_test.ts`.

Mapping:

- `src/<group>/<rule>.ts` becomes `src/rules/<rule>.ts`; `src/<group>/mod.ts`
  becomes a list in `src/plugin/index.ts`; `src/scanner/` and `src/helpers/` become
  `src/helpers/` (see [[cross-file-detection]]).
- `Deno.lint.Rule` becomes `LitRule`; `ctx.report({ range, message, hint })`
  becomes `context.report({ loc: rangeLoc(...), messageId, data })` with one
  sentence per message and fix advice in suggestions where judgment is needed.
- `tests/<rule>_test.ts` becomes one `testRule` call in
  `src/rules/<rule>.test.ts`; `tests/harness.ts` (which installed a TS program
  per snippet) is gone; `tests/scanner_fixture/` became the `writeProject`
  fixtures in `src/helpers/lit.test.ts` and `src/helpers/registration.test.ts`.
- `no-legacy-imports` read removed names from the `lit` package at runtime;
  port it with a static list so `lit` stays a devDependency.

Open questions, flagged and not decided:

- The plan suggests dropping the `!isLitComponent` guard in
  `host-constructor`, `paired-lifecycle`, `self-registration`, and
  `require-controller-suffix`. That would change behavior for a class that is
  both a component and `implements ReactiveController`; the helper exists, so
  keep the guard unless the user says otherwise.
- Rule options for the hard-coded lists, see [[one-plugin-presets-as-configs]].
- Version: 0.8.0 is assumed, following explicit-types (Deno 0.5.1, npm 0.6.0).
- `LICENSE` keeps the Deno repo's notice that parts derive from
  `eslint-plugin-lit` (MIT requires it), below the standard MIT text.
