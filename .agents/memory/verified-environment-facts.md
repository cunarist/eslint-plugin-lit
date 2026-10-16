---
description: AST and tooling facts checked against Oxlint 1.87, ESLint 9.39, typescript-eslint 8.71
---

Checked empirically against Oxlint 1.87 (Vite+ 1.1.0), ESLint 9.39, and
`@typescript-eslint/parser` 8.71:

- Both hosts hand rules a TypeScript-ESTree tree. String literals are node type
  **`Literal`** with a `.value`.
- `TSESTree` node `type`s are a string enum, but comparing one to a string
  literal (`node.type === "Literal"`) type-checks.
- Abstract members are **`TSAbstractMethodDefinition`** and
  **`TSAbstractPropertyDefinition`**, not `MethodDefinition` and
  `PropertyDefinition`. A rule matching one must match both.
- An overload signature or abstract method is a `TSEmptyBodyFunctionExpression`
  under its method node, and interface methods are `TSMethodSignature`. A rule
  walking functions must include both or they slip through.
- `MethodDefinition` needs no visitor of its own: its `value` is visited in its
  own right, so adding one double reports.
- `Property` covers destructuring as well as object literals. Check
  `node.parent.type === "ObjectExpression"` to tell a declared key from a bound
  name.
- `TSParameterProperty` wraps the parameter; the type annotation's parent is
  still the inner `Identifier`, with `optional` populated.
- **`AccessorProperty` type annotations are walked** by both hosts, unlike Deno.
  `accessor a?: T` does not parse under Oxlint.
- Oxlint's parser rejects a required parameter after an optional one, so test
  snippets must be valid TypeScript, not just valid syntax.
- Oxlint's `RuleTester` counts **columns from 0**, ESLint's from 1.
- ESLint's `RuleTester` parses as TypeScript only when given a `.ts` filename
  with `@typescript-eslint/parser`; the harness sets both.
- The type systems do not meet: `@eslint/core`'s `RuleDefinition` is not
  assignable to Oxlint's `Rule` (`meta.docs` lacks an index signature; the
  `sourceCode` shapes differ), and `@typescript-eslint/utils`' `RuleModule` fits
  neither. Oxlint runs ESLint rules unchanged at runtime; the harness bridges the
  types in one documented place.
- Oxlint loads a `.ts` plugin from a relative path directly on Node 24, `#`
  imports and a JSON import of `package.json` included.
- Oxlint and Oxfmt respect `.gitignore`; that is the only reason `dist/` and
  `node_modules/` are not linted.

Checked for this repo (Oxlint 1.88 through Vite+ 1.2.0, ESLint 9.39, oxc-parser
0.154, oxc-resolver 11.24), each proven by `src/helpers/lit.test.ts` and `registration.test.ts` under both
hosts:

- `context.sourceCode.getScope(node)` returns a scope with `upper` and a `set`
  `Map` of variables whose `defs` carry `type` (`ImportBinding`, `ClassName`,
  `Variable`), `node`, and `parent`, in both hosts.
- `context.sourceCode.getLocFromIndex` exists in both; it turns a template
  range into the `loc` a report needs.
- A `TemplateElement`'s span may or may not cover its delimiters; the span's
  length against `value.raw` tells, and `templateSource` handles both.
- `oxc-parser`'s `parseSync` returns plain objects with UTF-16 offsets and
  TS-ESTree shapes; its `Visitor` walks them. Its `TemplateElement` spans
  include the delimiters.
- `oxc-resolver`'s `resolveDtsSync(file, specifier)` lands `lit` on
  `node_modules/lit/index.d.ts` and `lit/decorators.js` on `decorators.d.ts`,
  with no options.
- A packed build with these helpers loads as an Oxlint `jsPlugins` entry from
  `dist/index.js`; `oxc-parser`, `oxc-resolver`, and `parse5` stay external.
