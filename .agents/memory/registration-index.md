---
description: Tag registrations are indexed over the tsconfig program plus imported .d.ts; runtime imports are direct, except through a barrel in its own folder
---

`require-direct-registration-import` is the one rule that needs facts about
the whole project. They are in `src/helpers/registration.ts` (the index),
`src/helpers/project.ts` (the project's files), and
`src/helpers/runtime-imports.ts`, and reached from
rules through `tagRegistrations(context)` and `runtimeImports(context)`.

**Registration index.** The project is the directory of the nearest
`tsconfig.json` (else `package.json`); its files are selected the way
TypeScript selects them: `include` (default `**/*`) minus `exclude` (default
`node_modules`, `bower_components`, `jspm_packages`), `.ts`/`.mts`/`.cts` only.
Every import, type-only included, is then followed into packages, since a
package's `.d.ts` is where it augments `HTMLElementTagNameMap`. A tag is
registered by `customElements.define("tag", ...)` with `customElements` not
bound at the file's top level, by Lit's `@customElement("tag")` (identity
checked through imports, aliases allowed), or by a global
`HTMLElementTagNameMap` entry (inside `declare global`, or in a script file),
recorded against the file that declares the mapped class. Only tags with a
hyphen; the first registration seen wins. Memoized per worker per project
root; rebuilt when the file list or any indexed file's `mtime` changes.

**Cost (decided 2026-10-17).** The file listing is cached per worker and
project root too, invalidated by `mtime` (not per process run), so editor and
watch sessions stay correct: it records `tsconfig.json` and every folder it
read, since adding or removing an entry bumps its folder's `mtime`; a listing
that saw an `mtime` under 2 s old is walked again (coarse fs clocks: FAT
stamps every 2 s). The
walk is our own `readdirSync` traversal from each `include` pattern's literal
base, matched with `minimatch` using the options of Node's `path.matchesGlob`
(that export needs Node 22.5; the plugin supports all of Node 22); it prunes `node_modules` (any default
exclude segment), dot-folders when no `include` names one, and literal
`exclude` folders (`dist`, `dist/**`). Re-globbing per lookup, which walked
`node_modules` through the `exclude` glob, cost memona's user_app 129 s of a
182 s lint. `src/helpers/project.test.ts` counts `readdirSync` calls; the
glob helpers live in `src/helpers/globs.ts`, and `globs.test.ts` checks them
against `path.matchesGlob`.
The Deno version checked `customElements` and `HTMLElementTagNameMap`
against `lib.dom.d.ts`; a binding nested below the top level of another file
is not seen now.

**Runtime imports.** The modules a file runs: its own non-type-only imports
and re-exports, plus what an imported barrel runs from inside its own folder,
barrel to barrel down the tree. Any other re-exporting file is not followed:
a fully transitive graph was tried in Deno and reverted, because it let any
barrel anywhere satisfy the rule, the borrowed import the rule rejects.
Visited files are tracked so cycles end.

**Barrel name:** `index.ts` (the `BARREL` constant), the org's entry-file
convention, decided on 2026-10-16. Deno's `mod.ts` is not a barrel here: a
`mod.ts` is an ordinary re-exporting file and is not followed. Both
`src/helpers/registration.test.ts` and the rule's own test cover the two cases.
