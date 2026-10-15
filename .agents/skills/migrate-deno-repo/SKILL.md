---
name: migrate-deno-repo
description: Checklist for moving a Deno repo (or a leftover Deno part of one) to Node 22+ + Vite+ with npm, same behavior, full lint parity, one PR
---

Template: `cunarist/eslint-plugin-explicit-types` on `main`. Read its
`AGENTS.md`, `vite.config.ts`, `scripts/project-lint.ts`, `package.json`, and
CI before starting, and copy their shape. Never ask the user mid-way when
they're away: decide by the memories, record the choice in the PR.

Branch `node-migration` (apps) or `initial-port` (new plugin repos); one PR
with everything.

**Inventory first**

- [ ] List every `deno.json` task, import-map entry, lint rule (tags,
      includes, `@hugoalh`, custom plugins), test, `Deno.*` call, JSON/CSS/SVG
      import, and every place the output is consumed (Rust, HTML,
      Containerfile, CI).

**Toolchain**

- [ ] `package.json` in the required key order, `engines.node ">=22"`, no
      `packageManager`, no `peerDependencies`; `npm install`; commit
      `package-lock.json`.
- [ ] `tsconfig.json` from the template; `vite.config.ts` with `fmt:
      { sortPackageJson: false }` and the category-based `lint` block.
- [ ] Delete `deno.json`, `deno.lock`, and Deno-only files. `mod.ts` →
      `index.ts`; `deno.json` imports → `package.json` `imports` (`#x/*`
      patterns for trailing-slash mappings); `jsr:`/`npm:` → npm packages.

**Code**

- [ ] Only `.ts` files; no non-`.ts` imports: CSS via `<link>`, JSON and SVG
      as `.ts` modules, icons in memona's style.
- [ ] `Deno.*` → `node:*` / `process`. Generated JS written as `.ts`, built,
      gitignored.
- [ ] Decorators stay standard with `accessor`; add `scripts/decorators.ts`
      if the repo has any. Lit repos: `scripts/lit-check.ts` + `npm run
      lit-check`.

**Lint**

- [ ] `scripts/project-lint.ts` copied; old local Deno lint rules ported into
      it; parity mapping for every former rule; `id-match`; no disable
      comments; no source `overrides`; refactor size-rule hits.

**Tests**

- [ ] `Deno.test` → Vitest (codemod, then finish TODOs); unit tests next to
      code, integration in `tests/`; no case dropped.

**Build, ship, CI**

- [ ] `vp build` in app mode with the same output paths, or `vp pack` for
      packages. Containerfile node stage on `node:24-alpine`. CI with
      `setup-vp`: `vp check`, build, `vp test` (+ lit-check). Packages:
      release-triggered `publish.yml`.
- [ ] `AGENTS.md` with the damem header, `.agents/` notes from the damem kit,
      README updated (Node.js 22+, no Deno instructions). `damem doctor`
      clean.

**Finish**

- [ ] `vp check`, `vp test`, build all pass locally; the app runs.
- [ ] Commit in plain imperative sentences; open the PR (summary, changes,
      parity mapping, deviations/risks, "CI fails until @cunarist/eslint-plugin-*
      are published" if relevant, verification, footer line).
- [ ] Run `review-cycle`. Never merge, publish, or archive.
