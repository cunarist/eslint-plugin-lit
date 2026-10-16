---
description: Rules use ESLint's create API, typed LitRule, with every visitor node parameter annotated by hand
---

Rules are plain ESLint rules: `meta` plus `create(context)`, never Oxlint's
`createOnce`. A rule is typed `LitRule` from `#helpers`: `@eslint/core`'s
`RuleDefinition`, with `TSESTree` nodes from `@typescript-eslint/types`, so
`context.report` takes TypeScript nodes. `LitSourceCode` adds what both hosts
implement and the helpers read: `getScope`, `getDeclaredVariables`,
`scopeManager`, and `getLocFromIndex`.

ESLint's visitor type is loose, so every visitor annotates its node parameter
(`TaggedTemplateExpression(node: TSESTree.TaggedTemplateExpression): void`).
Forget one and the parameter is `any`; the type-aware `typescript/no-unsafe-*`
rules in `vite.config.ts` then fail.

Why not the alternatives, all checked on the template repo:

- `@typescript-eslint/utils`' `RuleModule` is assignable to neither ESLint's
  `RuleDefinition` nor Oxlint's `Rule`.
- Oxlint's `Rule` type would make the package depend on `@oxlint/plugins`.

Messages are one string, Deno's old `message` and `hint` joined, because ESLint
and Oxlint diagnostics have no hint field. Report with `messageId` and `data`
so tests can assert which message fired. A template rule reports a range
inside the template through `rangeLoc(context.sourceCode, range)`, since
ESLint's `report` takes a `loc`, not Deno's `range`. See [[plugin-dual-ruletester]].

Runtime dependencies, all in `dependencies` and never bundled: `@eslint/core`
(types the public `.d.ts` names), `parse5` (template markup), and `oxc-parser`
plus `oxc-resolver` (reading other files, see [[cross-file-detection]]).
