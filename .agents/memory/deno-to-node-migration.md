---
description: Every repo moved from Deno to Node + Vite+ in Oct 2026 because Cloudflare bought Deno; nothing goes back to Deno
---

On 2026-10-12 the user moved every project from Deno to Node.js + Vite+
(`vp`). Cloudflare bought Deno on 2026-10-09; the runtime gets roughly 12
months of maintenance and Deno Deploy shuts down around April 2027. None of the
repos used Deploy or KV, so the move is about the toolchain, not hosting.

Do not reintroduce `deno.json`, `deno.lock`, `Deno.*` APIs, `jsr:` or `npm:`
specifiers, `mod.ts` entries, or `deno task` anywhere, docs and scripts
included.

## Order the migration followed

1. The custom Deno lint plugins were ported to npm first, as
   `@cunarist/eslint-plugin-explicit-types`, `-import-check`, and `-lit`.
   `cunarist/eslint-plugin-explicit-types` is the template every other repo
   copies (config shape, `scripts/project-lint.ts`, AGENTS.md, notes).
2. Then `commons/bot-agents` (six repos use it as an action), then the apps:
   home, eximium, stockvibe, brain, memona, memona-home.
3. deno-practice, interview-practice, web-landing, and vemium were left out
   (archivable). Old `cunarist/deno-*` repos are archived one at a time, and
   only after their `eslint-plugin-*` replacement is published to npm.

## What "migrated" means

- Same behavior. A migration PR changes tooling, not features.
- Lint coverage is at least what Deno enforced: [[lint-parity-never-shrinks]].
- Only three config files and only `.ts`: [[toolchain-node-vite-plus]],
  [[ts-only-files-and-imports]].
- Deno.test suites became Vitest: [[tests-layout-vitest]].

The custom plugins' Deno names map like this:

| Deno                                            | npm                                      |
| ----------------------------------------------- | ---------------------------------------- |
| `jsr:@cunarist/deno-lint-plugin-explicit-types` | `@cunarist/eslint-plugin-explicit-types` |
| `jsr:@cunarist/deno-import-check` (`./lint`)    | `@cunarist/eslint-plugin-import-check`   |
| `jsr:@cunarist/deno-lint-plugin-lit`            | `@cunarist/eslint-plugin-lit`            |
| `scripts/deno-lint-plugin.ts` (per app)         | `scripts/project-lint.ts` (per app)      |

Until those packages are on npm, a repo that depends on them fails `npm ci` in
CI; that is expected and stated in the PR, never worked around by committing
tarballs or `file:` dependencies.
