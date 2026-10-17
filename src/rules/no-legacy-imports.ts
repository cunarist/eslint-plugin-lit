import type { TSESTree } from "@typescript-eslint/types";

import { docsUrl, LEGACY_LIT_SOURCES, LIT_CORE_SOURCES } from "#helpers";
import type { LitRule, LitRuleContext } from "#helpers";

/**
 * Names Lit 2 removed, mapped to their replacement. A static list, so `lit`
 * stays a devDependency rather than something the rule reads at runtime.
 */
const LEGACY_NAMES: ReadonlyMap<string, string> = new Map([
  ["UpdatingElement", "ReactiveElement"],
  ["internalProperty", "state"],
]);

/** The package part of a module specifier, ignoring any subpath. */
function packageOf(source: string): string {
  return source.split("/")[0] ?? source;
}

/** Reports an import from a Lit 1 module path, suggesting `lit` for the bare package. */
function reportLegacyPath(context: LitRuleContext, node: TSESTree.ImportDeclaration): void {
  const source = node.source.value;
  // Only the package itself maps onto `lit` one to one; a subpath may
  // have moved, so it gets no suggestion.
  const quote = node.source.raw.charAt(0);
  context.report({
    node: node.source,
    messageId: "legacyPath",
    data: { source },
    ...(source === packageOf(source)
      ? {
          suggest: [
            {
              messageId: "useLit",
              fix: (fixer) => fixer.replaceText(node.source, `${quote}lit${quote}`),
            },
          ],
        }
      : {}),
  });
}

/** Reports one import specifier that names something Lit 2 removed. */
function checkSpecifier(context: LitRuleContext, specifier: TSESTree.ImportClause): void {
  if (specifier.type !== "ImportSpecifier") {
    return;
  }
  const imported = specifier.imported;
  if (imported.type !== "Identifier") {
    return;
  }
  const replacement = LEGACY_NAMES.get(imported.name);
  if (replacement === undefined) {
    return;
  }
  // Keep the local name, so the code that uses it stays as it is.
  const aliased = specifier.local.range[0] !== imported.range[0];
  context.report({
    node: imported,
    messageId: "legacyName",
    data: { name: imported.name, replacement },
    suggest: [
      {
        messageId: "useReplacement",
        data: { replacement },
        fix: (fixer) =>
          fixer.replaceText(imported, aliased ? replacement : `${replacement} as ${imported.name}`),
      },
    ],
  });
}

/**
 * `no-legacy-imports` — rejects imports from the Lit 1 module paths `lit-html`
 * and `lit-element`, and imports of names Lit 2 removed.
 *
 * The old paths still resolve in mixed installs, so the mistake is silent.
 */
export const noLegacyImportsRule: LitRule = {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow Lit 1 module paths and the names Lit 2 removed",
      url: docsUrl("no-legacy-imports"),
    },
    hasSuggestions: true,
    schema: [],
    messages: {
      legacyPath: 'Unexpected Lit 1 module path "{{source}}".',
      legacyName: 'Unexpected "{{name}}", which Lit 2 removed in favor of "{{replacement}}".',
      useLit: 'Import from "lit" instead.',
      useReplacement: 'Import "{{replacement}}" instead.',
    },
  },
  create(context) {
    return {
      ImportDeclaration(node: TSESTree.ImportDeclaration): void {
        const pkg = packageOf(node.source.value);
        if (LEGACY_LIT_SOURCES.includes(pkg)) {
          reportLegacyPath(context, node);
        }
        if (!LIT_CORE_SOURCES.includes(pkg)) {
          return;
        }
        for (const specifier of node.specifiers) {
          checkSpecifier(context, specifier);
        }
      },
    };
  },
};
