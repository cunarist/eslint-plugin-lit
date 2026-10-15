---
description: Tag registrations are indexed over the tsconfig program plus imported .d.ts; runtime imports are direct, except through a barrel in its own folder
---

`require-direct-registration-import` is the one rule that needs facts about
the whole project. Both are in `src/helpers/registration.ts` and reached from
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
The Deno version checked `customElements` and `HTMLElementTagNameMap`
against `lib.dom.d.ts`; a binding nested below the top level of another file
is not seen now.

**Runtime imports.** The modules a file runs: its own non-type-only imports
and re-exports, plus what an imported barrel runs from inside its own folder,
barrel to barrel down the tree. Any other re-exporting file is not followed:
a fully transitive graph was tried in Deno and reverted, because it let any
barrel anywhere satisfy the rule, the borrowed import the rule rejects.
Visited files are tracked so cycles end.

**Open question for the user:** the barrel is `mod.ts`, as in Deno (the
`BARREL` constant). Node projects and this org's convention use `index.ts`.
Switching or accepting both changes the rule's behavior, so it waits for a
decision.
