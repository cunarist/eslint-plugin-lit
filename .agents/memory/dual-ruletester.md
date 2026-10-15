---
description: Every rule test runs under both ESLint's and Oxlint's RuleTester, written once in ESLint's shape
---

Each rule's test file calls `testRule` from `#testing` exactly once, with every
case in one `valid` and one `invalid` list (the typescript-eslint and unicorn
style); a `//` comment heads each group of cases. Both testers reject a repeated
`code` within one run, so a span check goes on the same case as the other
assertions for that snippet, not on a copy of it.

`testRule` runs each case twice, in Vitest: under ESLint's
`RuleTester` with `@typescript-eslint/parser` and a `.ts` filename, and under
Oxlint's (`vite-plus/lint/plugins-dev`). No ESLint config file is involved.

Write cases in ESLint's shape. `spanOf(code, text)` gives ESLint's 1-based
columns; the harness subtracts one for Oxlint, which counts columns from 0.
Placeholder `data` must be strings, because Oxlint types it narrower than
ESLint.

The two type systems do not meet: `RuleDefinition` is not assignable to
Oxlint's `Rule` (`meta.docs` has no index signature, the `sourceCode` shapes
differ), though Oxlint runs ESLint rules unchanged. The harness widens Oxlint's
`run` parameter in one documented interface, `OxlintRunner`; the Oxlint half of
every test proves the runtime agrees.

CI runs `vp test -t " eslint "` and `vp test -t " oxlint "` as separate steps,
so a failure names its host. That filter is why `testRule`
nests its suites as `<rule> > eslint|oxlint`: a name that starts with the host
has no leading space and would match neither step. See [[rule-typing-litrule]].

Every case is linted as an absolute path. A snippet defaults to `example.ts`
at the repository root, where `lit` is installed, so its Lit imports resolve
as in a real project. A rule that reads other files gets a throwaway project
from `writeProject(files)` in `#testing` (a temp directory with the repo's
`node_modules` linked in, deleted after the test file), and its cases name a
file there as `filename`; valid cases take `{ code, filename }` for that.
Fixtures live in the test, never on disk in the repo, so nothing lints or
type-checks them and the cycles and `mod.ts` barrels they need are allowed.
`src/helpers/lit.test.ts` drives the detection helpers through a probe rule
the same way.
