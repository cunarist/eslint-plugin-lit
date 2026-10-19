/**
 * `project` — lint rules this repository holds its own source to that are not
 * part of the published plugin. A rule kept only for this repo's own lint
 * lives in this file. Its rules of its own are `no-disable-comments` and
 * `no-asset-imports`.
 *
 * Loaded by `vite.config.ts` as an Oxlint `jsPlugins` entry, never packed:
 * `vp pack` builds `src/plugin/index.ts` alone and the tarball holds only `dist/`.
 *
 * @module
 */

import type { RuleDefinition } from "@eslint/core";
import type { TSESTree } from "@typescript-eslint/types";
import type { DummyRuleMap } from "vite-plus/lint";

import type { LitRuleTypes, LitSourceCode } from "#helpers";

/** The published rules' source code, plus the comment list both hosts provide. */
interface ProjectSourceCode extends LitSourceCode {
  getAllComments(): TSESTree.Comment[];
}

/** The published rules' type parameters, with comments readable. */
interface ProjectRuleTypes extends LitRuleTypes {
  Code: ProjectSourceCode;
}

/** A repo-local rule, in ESLint's standard `create` form. */
type ProjectRule = RuleDefinition<ProjectRuleTypes>;

/** A comment that turns lint rules off or back on, in ESLint or Oxlint form. */
const DIRECTIVE_PATTERN: RegExp = /^\s*(?:eslint|oxlint)-(?:disable|enable)/u;

/** This rule's own name, which a directive may not use to silence it. */
const RULE_NAME: string = "no-disable-comments";

/**
 * `no-disable-comments` — rejects every `eslint-disable*`, `eslint-enable*`,
 * `oxlint-disable*`, and `oxlint-enable*` comment, line or block. Oxlint has
 * no `noInlineConfig` and no `eslint-comments` rules, so this repo bans them
 * itself: when a rule fires, fix the source.
 *
 * A directive can silence the report on itself, so two built-in checks close
 * the gaps: `unicorn/no-abusive-eslint-disable` fails one that names no rule,
 * and this rule skips one that names it, which then silences nothing and fails
 * `reportUnusedDisableDirectives` in `vite.config.ts`.
 */
const noDisableCommentsRule: ProjectRule = {
  meta: {
    type: "problem",
    docs: { description: "Disallow lint disable and enable comments" },
    schema: [],
    messages: { directive: "Lint disable comments are not allowed; fix the source." },
  },
  create(context) {
    return {
      Program(_node: TSESTree.Program): void {
        for (const comment of context.sourceCode.getAllComments()) {
          if (DIRECTIVE_PATTERN.test(comment.value) && !comment.value.includes(RULE_NAME)) {
            context.report({ loc: comment.loc, messageId: "directive" });
          }
        }
      },
    };
  },
};

/** A module specifier read as a path: relative, absolute, or a `#` alias. */
const PATH_SPECIFIER_PATTERN: RegExp = /^[./#]/u;

/**
 * The extensions a module may be imported by: our own `.ts` files and package
 * `.js`, `.mts`, and `.mjs` subpaths.
 */
const MODULE_EXTENSIONS: ReadonlySet<string> = new Set([".ts", ".js", ".mts", ".mjs"]);

/**
 * Whether `source` names an asset rather than a module: a query string such
 * as `?raw`, or a final path segment whose whole extension is not `.ts`,
 * `.js`, `.mts`, or `.mjs`. Bare package names are left alone, dots and all, as are
 * extensionless paths.
 */
function isAssetSource(source: string): boolean {
  if (source.includes("?")) {
    return true;
  }
  const segments: string[] = source.split("/");
  if (!PATH_SPECIFIER_PATTERN.test(source)) {
    const nameLength: number = source.startsWith("@") ? 2 : 1;
    if (segments.length <= nameLength) {
      return false;
    }
  }
  const lastSegment: string = segments.at(-1) ?? "";
  if (lastSegment === "." || lastSegment === ".." || !lastSegment.includes(".")) {
    return false;
  }
  return !MODULE_EXTENSIONS.has(lastSegment.slice(lastSegment.lastIndexOf(".")));
}

/**
 * `no-asset-imports` — rejects importing anything but a `.ts`, `.js`, `.mts`,
 * or `.mjs` module: a source path, static or a dynamic `import()` with a
 * string literal, ending in another extension (`.css`, `.json`, `.svg`,
 * `.jsx`, `.tsx`, `.cjs`) or carrying a query string (`?raw`, `?url`), and
 * any import or export with import attributes. `.js`, `.mts`, and `.mjs`
 * cover package subpaths such as `lit/decorators.js`; this repo's own files
 * are all `.ts`. Bare package names, `#` aliases, and `node:`
 * builtins without an extension pass; package subpaths are checked like paths.
 */
const noAssetImportsRule: ProjectRule = {
  meta: {
    type: "problem",
    docs: { description: "Disallow importing CSS, JSON, SVG, and other non-module assets" },
    schema: [],
    messages: {
      extension: "Only .ts, .js, .mts and .mjs modules may be imported.",
      attributes: "Import attributes are not allowed.",
    },
  },
  create(context) {
    function checkSource(source: TSESTree.StringLiteral): void {
      if (isAssetSource(source.value)) {
        context.report({ node: source, messageId: "extension" });
      }
    }
    function checkDeclaration(
      node:
        | TSESTree.ImportDeclaration
        | TSESTree.ExportNamedDeclaration
        | TSESTree.ExportAllDeclaration,
    ): void {
      if (node.source === null) {
        return;
      }
      checkSource(node.source);
      if (node.attributes.length > 0) {
        context.report({ node, messageId: "attributes" });
      }
    }
    return {
      ImportDeclaration: checkDeclaration,
      ExportNamedDeclaration: checkDeclaration,
      ExportAllDeclaration: checkDeclaration,
      ImportExpression(node: TSESTree.ImportExpression): void {
        if (node.source.type === "Literal" && typeof node.source.value === "string") {
          checkSource(node.source);
        }
        if (node.options !== null) {
          context.report({ node, messageId: "attributes" });
        }
      },
    };
  },
};

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
  "typescript/switch-exhaustiveness-check": ["error", { considerDefaultExhaustiveForUnions: true }],
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
  // Collides with no-undef-init: a `let` assigned in try or if/else has no
  // value to start from but `undefined`.
  "init-declarations": "off",
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

/** Node code (`vite.config.ts` and `scripts/`), spread into `overrides`. */
const nodeRules: DummyRuleMap = {
  // Vite and the Oxlint plugin host read a default export.
  "import/no-default-export": "off",
  // Node code: tooling imports Node's built-ins.
  "import/no-nodejs-modules": "off",
  // Node code: a CLI exits with a status.
  "unicorn/no-process-exit": "off",
};

/**
 * The repo-local plugin, namespace `project`: its own rules, enabled as
 * `project/<rule>`, `configs.project`, the rule list above, and
 * `configs.node`, the Node code override.
 */
const plugin = {
  meta: { name: "project" },
  rules: {
    "no-disable-comments": noDisableCommentsRule,
    "no-asset-imports": noAssetImportsRule,
  },
  configs: { project: { rules }, node: { rules: nodeRules } },
};

export default plugin;
