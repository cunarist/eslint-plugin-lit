---
description: package.json keys follow Oxfmt's standard sorting; standard fields only; no peerDependencies or packageManager
---

## Key order (2026-10-16)

Oxfmt's standard `package.json` sorting decides the key order; there is no
`fmt.sortPackageJson: false`. Run `vp check --fix` after editing the file.
This replaces the earlier hand-written order (metadata, `scripts`, `exports`,
`imports`, dependencies). The fields themselves:

```jsonc
{
  "name": "eslint-plugin-x",
  "version": "0.1.0",
  "description": "...",
  "keywords": ["eslint", "eslint-plugin", "eslintplugin", "oxlint"],
  "license": "MIT",
  "repository": { "type": "git", "url": "git+https://github.com/..." },
  "type": "module",
  "files": ["dist"],
  "engines": { "node": ">=22.18" },
  "eslint-doc-generator": {/* tool options that can only live here */},
  "scripts": { "docs": "eslint-doc-generator" },
  "exports": { ".": "./dist/index.js" },
  "imports": { "#helpers": "./src/helpers/index.ts" },
  "devDependencies": { "vite-plus": "^1.1.0" },
  "dependencies": {},
}
```

An alias may point anywhere and owns its target, with no 2 aliases owning
the same file; see [[imports-aliases-barrels]].

## Fields

- **Standard fields only.** `engines` has only `node` (never `engines.bun`).
  A tool-owned key (`eslint-doc-generator`) is allowed only because the tool
  reads nothing else and no other config file is allowed.
- **No `packageManager`.** npm is detected from `package-lock.json`.
- **No `peerDependencies`, ever** (user preference, 2026-10-14). If something
  is needed at runtime, it goes in `dependencies`.
- **`dependencies`** = what runs or is type-referenced at runtime by consumers
  (the lit plugin ships `parse5`, `oxc-parser`, `oxc-resolver`, and
  `@eslint/core` for its public types; they stay external, never bundled).
- **`devDependencies`** = everything else: `vite-plus`, `eslint`,
  `@typescript-eslint/parser`, `eslint-doc-generator`, `@types/node`. ESLint is a devDependency only; plugins need
  nothing from it at runtime.

Refresh the lockfile with `npm install` (or `npm install
--package-lock-only` for a version bump) and commit it with the change.
