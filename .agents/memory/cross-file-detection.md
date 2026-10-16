---
description: Lit detection follows imports to declarations with oxc-resolver and oxc-parser instead of the TypeScript checker; accurate or silent
---

The Deno plugin built a TypeScript program at load
(`@cunarist/typescript-deno-lint`) and asked the checker three things: is this
tag Lit's `html`/`svg`/`css`, does this class's heritage reach `LitElement` or
`ReactiveElement`, and which module registers tag X. No rule needed real type
inference, so the port drops the checker, the `typescript` dependency, and
`typescript-deno-lint`. Oxlint JS plugins have no type information anyway.

How the same answers are reached now (`src/helpers/`):

- `lit.ts`, over the linted file: a name is looked up through the host's scope
  analysis (`getScope`, then `upper`), so a parameter or block-local `html` or
  `LitElement` is not Lit's. A local class, `const`, class expression, or mixin
  call `Mixin(Base)` (its arguments) is followed in the same tree.
- `modules.ts` and `bindings.ts`, for every other file: an import is resolved with
  `oxc-resolver`'s `resolveDtsSync`, TypeScript's own algorithm for
  declarations, so `lit` lands on `lit/index.d.ts` and package `imports` and
  tsconfig `paths` work; the file is parsed with `oxc-parser`; re-exports,
  `export *`, `export * as ns`, defaults, and namespace imports are followed to
  the declaration. Parses are cached per worker by real path and reparsed when
  `mtime` or size changes, so an editor session sees edits. Nothing is written.
- `identity.ts`: a declaration is Lit's by name plus declaring file, as the
  checker decided it: `LitElement`/`ReactiveElement` classes under
  `lit-element/` or `@lit/reactive-element/`, `html` in lit-html's
  `lit-html.d.ts` or `static.d.ts`, `svg` in `lit-html.d.ts` only, `css` in
  `css-tag.d.ts`, `customElement` in `custom-element.d.ts`. The path patterns
  allow no folder between package and file, which `node_modules` has and
  Deno's versioned npm cache did not. A declaration file's typed mixin,
  `declare const X_base: typeof LitElement & ...`, is followed through
  `typeof`.
- `controllers.ts`: reactive controllers, by their `implements
  ReactiveController` clause. `specifiers.ts`: Lit's module specifiers and
  the local names a matching import binds.
- `registration.ts`, `project.ts`, `runtime-imports.ts`: see
  [[registration-index]].

The policy is unchanged: accurate or silent. Anything unresolvable, an
unparsable file, or a name declared more than once answers "not Lit". So `lit`
must be installed where the linted code is, as it had to be for the checker.

Known differences from the checker, to keep in mind when porting a rule:

- A mixin is recognized by its arguments, not its return type. A mixin whose
  argument is not the base it returns would differ; none is known in practice.
- Shadowing is exact in the linted file only. In other files names are looked
  up at the top level.
- The linted file's own text comes from the host (`moduleFromText`), saved or
  not; every other file is read from disk.

`src/helpers/lit.test.ts` and `src/helpers/registration.test.ts` drive all
of this through probe rules under both hosts, porting the Deno `scanner_*` tests. See [[verified-environment-facts]].
