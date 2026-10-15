---
description: No lint overrides for source files; narrow ones only for scripts/**; generated files go in ignorePatterns; refactor (barrels, splits) instead of raising limits
---

Final policy (2026-10-16). The user considers per-file `overrides` bad
practice.

- **Source files: never.** No `overrides` entry may target `src/**` or any
  other hand-written production or test code.
- **The one exception** is in lint-plugin repos: `import/max-dependencies`
  off for `src/rules/index.ts`, the rule registry, which must import every
  rule. It is not a precedent for apps.
- **`scripts/**`:** a narrow override is allowed when a tooling script truly
  needs it, e.g. `no-console` in a CLI script.
- **Generated files:** list them in `ignorePatterns`, never `overrides`.
- **Anything else needs the user's approval first.** When the user is away,
  don't add it: refactor, or leave the violation failing and log the question.

## Fix the code instead

Oxlint's defaults stay; violations are refactored without behavior change,
covered by the tests, inside the same migration PR.

| Rule                      | Usual fix                                               |
| ------------------------- | ------------------------------------------------------- |
| `import/max-dependencies` | import a barrel (`#ui`) instead of many direct modules  |
| `max-lines`               | split the file by responsibility                        |
| `max-lines-per-function`  | extract helpers; split a long Lit template into parts   |
| `max-classes-per-file`    | one class per file                                      |
| `max-params`              | pass one options object                                 |
| `prefer-set-has`          | `const K: ReadonlySet<string> = new Set([...])`, `.has` |

```ts
// before: 14 imports, over the limit of 10
import { a } from "#ui/button";
import { b } from "#ui/dialog";
// after: one barrel
import { a, b } from "#ui";
```

Measured on memona before the move (Oxlint 1.87, default limits): 921
pedantic hits in 274 files, of which `max-lines-per-function` 206,
`max-lines` 145, `max-classes-per-file` 59, `max-dependencies` 45 (median 14
imports, worst 29). The user chose refactoring over raising limits or
matching memona's old hugoalh limits (2048 lines per file, no function limit).
