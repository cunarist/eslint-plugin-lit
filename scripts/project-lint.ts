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

/** The extensions a module may be imported by: our own `.ts` files and package `.js` subpaths. */
const MODULE_EXTENSIONS: readonly string[] = [".ts", ".js"];

/**
 * Whether `source` names an asset rather than a module: a query string such
 * as `?raw`, or a final path segment with an extension other than `.ts` or
 * `.js`. Bare package names are left alone, dots and all, as are
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
  return !MODULE_EXTENSIONS.some((extension) => lastSegment.endsWith(extension));
}

/**
 * `no-asset-imports` — rejects importing anything but a `.ts` or `.js`
 * module: a source path, static or a dynamic `import()` with a string literal,
 * ending in another extension (`.css`, `.json`, `.svg`, `.tsx`) or carrying a
 * query string (`?raw`, `?url`), and any import or export with import
 * attributes. `.js` covers package subpaths such as `lit/decorators.js`; this
 * repo's own files are all `.ts`. Bare package names, `#` aliases, and `node:`
 * builtins without an extension pass; package subpaths are checked like paths.
 */
const noAssetImportsRule: ProjectRule = {
  meta: {
    type: "problem",
    docs: { description: "Disallow importing CSS, JSON, SVG, and other non-module assets" },
    schema: [],
    messages: {
      extension: "Only .ts and .js modules may be imported.",
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
 * published `all` config: rules beyond the Oxlint categories, plus a few
 * extras and opt-outs. Built-in Oxlint rule ids sit here too, so
 * `vite.config.ts` lists no rule by name.
 */
const rules: DummyRuleMap = {
  // Rules beyond the categories in `vite.config.ts`. First, naming: no `_`
  // inside the name once leading and trailing ones are trimmed, unless it
  // has no lowercase ASCII letter (UPPER_SNAKE). Shorthand destructuring
  // binds a key the code does not own, and property names are not
  // declarations.
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
  curly: "error",
  "guard-for-in": "error",
  "no-console": "error",
  "no-empty": "error",
  "no-regex-spaces": "error",
  "no-restricted-globals": ["error", "window"],
  "no-var": "error",
  "prefer-const": "error",
  "import/no-cycle": "error",
  "import/no-relative-parent-imports": "error",
  "typescript/adjacent-overload-signatures": "error",
  "typescript/consistent-type-imports": "error",
  "typescript/no-empty-interface": "error",
  "typescript/no-explicit-any": "error",
  "typescript/no-namespace": "error",
  "typescript/no-non-null-assertion": "error",
  "project/no-disable-comments": "error",
  "project/no-asset-imports": "error",
  "unicorn/no-abusive-eslint-disable": "error",
  // Pedantic rules that fight the AST types: nodes are mutable, and `type`
  // is an enum imported only as a type.
  "typescript/prefer-readonly-parameter-types": "off",
  "typescript/no-unsafe-enum-comparison": "off",
  "typescript/switch-exhaustiveness-check": ["error", { considerDefaultExhaustiveForUnions: true }],
};

/**
 * The repo-local plugin, namespace `project`: its own rules, enabled as
 * `project/<rule>`, and `configs.project`, the rule list above.
 */
const plugin = {
  meta: { name: "project" },
  rules: {
    "no-disable-comments": noDisableCommentsRule,
    "no-asset-imports": noAssetImportsRule,
  },
  configs: { project: { rules } },
};

export default plugin;
