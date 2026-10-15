---
description: Lit rule tests lint absolute paths; cross-file cases use writeProject throwaway projects, and only those two test files raise their timeout
---

The dual-host harness itself is described in [[plugin-dual-ruletester]]; this
note covers what is specific to this repo.

Every case is linted as an absolute path. A snippet defaults to `example.ts`
at the repository root, where `lit` is installed, so its Lit imports resolve
as in a real project. A rule that reads other files gets a throwaway project
from `writeProject(files)` in `#testing` (a temp directory with the repo's
`node_modules` linked in, deleted after the test file), and its cases name a
file there as `filename`; valid cases take `{ code, filename }` for that.
Fixtures live in the test, never on disk in the repo, so nothing lints or
type-checks them and the cycles and `index.ts` barrels they need are allowed.
`src/helpers/lit.test.ts` drives the detection helpers through a probe rule
the same way. See [[cross-file-detection]] and [[registration-index]].

The two files that write a project (`src/helpers/lit.test.ts` and
`src/rules/require-direct-registration-import.test.ts`) build the
registration index cold on their first case per host, up to about 3 s against
Vitest's 5 s default. Each raises its own timeout with
`vi.setConfig({ testTimeout: 20_000 })` at the top (decided 2026-10-16);
every other test file keeps the default. Rule typing: [[rule-typing-litrule]].
