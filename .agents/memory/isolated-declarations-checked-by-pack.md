---
description: isolatedDeclarations is enforced by vp pack (TS9010), not by vp check
---

`tsconfig.json` sets `isolatedDeclarations`, and tsdown then emits `.d.ts`
through Oxc with no `typescript` install. But `vp check`'s type check does not
report TS9010; only `vp pack` fails, at build time. Verified both ways.

Trivially inferable exports (`export const o = { a: 1 }`) pass both here and
under Deno's `no-slow-types`; `export const x = make()` fails both. CI runs
`vp pack` on every PR, so the gap is caught before merge.
