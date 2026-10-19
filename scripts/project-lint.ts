/**
 * `project` - lint rules this repository holds its own source to, not part of
 * the published plugin: the rule list in `configs.project`, and its own rules,
 * each in a flat `scripts/project-lint-*.ts` file: `prefer-ascii` and
 * `no-disable-comments` (`project-lint-source.ts`), `no-asset-imports`
 * (`project-lint-modules.ts`), and ports of the hugoalh `recommended` rules
 * Oxlint lacks (`project-lint-hugoalh.ts`, `project-lint-hugoalh-types.ts`).
 *
 * Loaded by `vite.config.ts` as an Oxlint `jsPlugins` entry, never packed:
 * `vp pack` builds `src/plugin/index.ts` alone and the tarball holds only `dist/`.
 *
 * @module
 */

import type { DummyRuleMap, OxlintOverride } from "vite-plus/lint";

import {
  noDuplicateInterfacesRule,
  noDuplicateTypesRule,
  noModifierPrivateRule,
  noUselessTypeRule,
} from "./project-lint-hugoalh-types.ts";
import {
  noDuplicateTypeofsRule,
  noEmptyYieldRule,
  noNanRule,
  noUnsafeNumberRule,
  noUselessContinueRule,
} from "./project-lint-hugoalh.ts";
import { noAssetImportsRule } from "./project-lint-modules.ts";
import { noDisableCommentsRule, preferAsciiRule } from "./project-lint-source.ts";

/**
 * This repository's own rule list, spread by `vite.config.ts` after the
 * published `all` config: the repo's own rules, offs from the Oxlint
 * categories, and option tweaks. Built-in Oxlint rule ids sit here too, so
 * `vite.config.ts` lists no rule by name.
 */
const rules: DummyRuleMap = {
  // Option tweaks. First, camelCase names: no `_` inside the name once
  // leading and trailing ones are trimmed, unless it has no lowercase ASCII
  // letter (UPPER_SNAKE). Shorthand destructuring binds a key the code does
  // not own, and property names are not declarations.
  "id-match": [
    "error",
    "^_*[^_]*_*$|^[^a-z]*$",
    {
      properties: false,
      classFields: false,
      onlyDeclarations: false,
      ignoreDestructuring: true,
    },
  ],
  "no-restricted-globals": ["error", "window"],
  // Single capital type parameters (`T`) are allowed.
  "id-length": ["error", { exceptionPatterns: ["^[A-Z]$"] }],
  // Limits set to the smallest values the current code passes.
  "max-statements": ["error", { max: 25 }],
  "max-params": ["error", { max: 4 }],
  "unicorn/max-nested-calls": ["error", { max: 4 }],
  "one-var": ["error", "never"],
  "no-use-before-define": ["error", { functions: false }],
  "func-style": ["error", "declaration", { allowArrowFunctions: true }],
  // The repo's own rules: no lint suppression and only `.ts` imports.
  "project/no-disable-comments": "error",
  "project/no-asset-imports": "error",
  // Deno's `prefer-ascii`, which also covers hugoalh's
  // `prefer-ascii-identifier`.
  "project/prefer-ascii": "error",
  // Ports of the hugoalh `recommended` rules with no Oxlint built-in, under
  // their hugoalh names.
  "project/no-duplicate-interfaces": "error",
  "project/no-duplicate-typeofs": "error",
  "project/no-duplicate-types": "error",
  "project/no-empty-yield": "error",
  "project/no-modifier-private": "error",
  "project/no-nan": "error",
  "project/no-unsafe-number": "error",
  "project/no-useless-continue": "error",
  "project/no-useless-type": "error",
  // hugoalh's `no-enum`, from explicit-types alone: its other rules target
  // app code, not this plugin's AST-typed sources.
  "explicit-types/no-enum": "error",
  // Off, collides with a repo or plugin rule, Oxfmt, or another category rule:
  // Collides with the mutable AST nodes the rules read.
  "typescript/prefer-readonly-parameter-types": "off",
  // Collides with plain TypeScript classes: no `public` noise.
  "typescript/explicit-member-accessibility": "off",
  // Collides with mutable private state the code writes on purpose.
  "typescript/prefer-readonly": "off",
  // Collides with written-out index signatures in place of `Record`.
  "typescript/consistent-indexed-object-style": "off",
  // Collides with written-out type annotations.
  "typescript/no-inferrable-types": "off",
  // Collides with Oxfmt's import sorting.
  "sort-imports": "off",
  // Collides with the `index.ts` barrels the `#` aliases point at.
  "oxc/no-barrel-file": "off",
  // Collides with exporting each declaration where it is written.
  "import/group-exports": "off",
  "import/exports-last": "off",
  // Collides with named exports, the rule files' convention.
  "import/prefer-default-export": "off",
  // Collides with the named `Rule` exports of the rule files.
  "import/no-named-export": "off",
  // Collides with consistent-type-imports' top-level `import type`.
  "import/consistent-type-specifier-style": "off",
  // Collides with the default exports the plugin entry and configs require.
  "import/no-default-export": "off",
  // Collides with RuleTester cases, whose code strings hold template literals.
  "no-template-curly-in-string": "off",
  // Collides with the bivariant method signatures the ESLint and Oxlint types need.
  "typescript/method-signature-style": "off",
  // Collides with the `path` locals the code names: a default `path` import
  // of `node:path` would shadow them.
  "unicorn/import-style": "off",
  // Collides with the AST node `type` enum, imported only as a type.
  "typescript/no-unsafe-enum-comparison": "off",
  // Collides with `unicorn/prefer-ternary`.
  "no-ternary": "off",
  // Collides with the Node target, which has `async`/`await`.
  "oxc/no-async-await": "off",
  // Collides with the Node target, which has `?.`.
  "oxc/no-optional-chaining": "off",
  // Collides with flags and hashing where bit operators are the point.
  "no-bitwise": "off",
  // Collides with `undefined` as the spelled-out absence of a value.
  "no-undefined": "off",
  // Collides with no-floating-promises' `void` for fire-and-forget calls.
  "no-void": "off",
  // Collides with the `null` that AST and DOM APIs return.
  "unicorn/no-null": "off",
  // Collides with Node code: the plugin, its tests, and tooling run on Node.
  "import/no-nodejs-modules": "off",
  "unicorn/no-process-exit": "off",
  // Off: TypeScript's type checking already proves switches exhaustive.
  "typescript/switch-exhaustiveness-check": "off",
  // Off: TypeScript checks completeness; a forced `default:` hides missing cases.
  "default-case": "off",
  // Off: not type-aware; `noImplicitReturns` covers missing returns.
  "consistent-return": "off",
  // Off: sequential awaits in loops are intentional; workarounds cost more.
  "no-await-in-loop": "off",
  // Off, too much churn:
  // Limits and indexes are plain numbers.
  "no-magic-numbers": "off",
  // Keys follow meaning, not the alphabet.
  "sort-keys": "off",
  // Comments continue sentences and quote code.
  "capitalized-comments": "off",
  // Arrow callbacks infer their return types.
  "typescript/explicit-function-return-type": "off",
  // Exports already declare their types.
  "typescript/explicit-module-boundary-types": "off",
  // No-op callbacks are common in tests and defaults.
  "no-empty-function": "off",
  // Methods that ignore `this` stay on their class.
  "class-methods-use-this": "off",
  // Most cases are one statement.
  "unicorn/switch-case-braces": "off",
  // Indexed reads would become destructuring everywhere.
  "prefer-destructuring": "off",
  // Object spread builds most option objects.
  "oxc/no-rest-spread-properties": "off",
  // Numeric literals keep their existing grouping.
  "unicorn/numeric-separators-style": "off",
  // Loops skip items with `continue`.
  "no-continue": "off",
};

/** Rules for Node code: `vite.config.ts` and `scripts/`. */
const nodeRules: DummyRuleMap = {
  // Vite and the Oxlint plugin host read a default export.
  "import/no-default-export": "off",
  // Node code: tooling imports Node's built-ins.
  "import/no-nodejs-modules": "off",
  // Node code: a CLI exits with a status.
  "unicorn/no-process-exit": "off",
};

/**
 * The whole Oxlint `overrides` list, used as is by `vite.config.ts`: the Node
 * code entry first, then the per-file exceptions, each with its reason. A
 * later entry wins over an earlier one.
 */
export const projectOverrides: OxlintOverride[] = [
  // Node code: the Vite config and repo tooling run on Node, not in a browser.
  { files: ["vite.config.ts", "scripts/**"], rules: nodeRules },
  // The rule registry imports every rule module by design.
  { files: ["src/rules/index.ts"], rules: { "import/max-dependencies": "off" } },
];

/**
 * The repo-local plugin, namespace `project`: its own rules, enabled as
 * `project/<rule>`, and `configs.project`, the rule list above.
 */
const plugin = {
  meta: { name: "project" },
  rules: {
    "no-disable-comments": noDisableCommentsRule,
    "no-asset-imports": noAssetImportsRule,
    "prefer-ascii": preferAsciiRule,
    "no-duplicate-interfaces": noDuplicateInterfacesRule,
    "no-duplicate-typeofs": noDuplicateTypeofsRule,
    "no-duplicate-types": noDuplicateTypesRule,
    "no-empty-yield": noEmptyYieldRule,
    "no-modifier-private": noModifierPrivateRule,
    "no-nan": noNanRule,
    "no-unsafe-number": noUnsafeNumberRule,
    "no-useless-continue": noUselessContinueRule,
    "no-useless-type": noUselessTypeRule,
  },
  configs: { project: { rules } },
};

export default plugin;
