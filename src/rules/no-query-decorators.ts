import type { TSESTree } from "@typescript-eslint/types";

import {
  docsUrl,
  enclosingClass,
  isLitComponent,
  keyName,
  type LitRule,
  type LitRuleContext,
} from "#helpers";

/** Decorators that resolve elements by selector or slot. */
const QUERY_DECORATORS: ReadonlySet<string> = new Set([
  "query",
  "queryAll",
  "queryAsync",
  "queryAssignedElements",
  "queryAssignedNodes",
]);

/** Module specifiers that export the Lit decorators. */
const DECORATOR_SOURCES: ReadonlySet<string> = new Set([
  "lit/decorators.js",
  "lit/decorators",
  "lit-element/decorators.js",
]);

/** The bare name a decorator is written with, called or not, or null. */
function decoratorName(decorator: TSESTree.Decorator): string | null {
  const expression = decorator.expression;
  const callee = expression.type === "CallExpression" ? expression.callee : expression;
  return callee.type === "Identifier" ? callee.name : null;
}

/** Reports every query decorator on a class member of a Lit component. */
function checkMember(
  context: LitRuleContext,
  node: TSESTree.Node,
  decorators: TSESTree.Decorator[],
): void {
  if (decorators.length === 0) {
    return;
  }
  const owner = enclosingClass(node);
  if (owner === null || !isLitComponent(owner, context)) {
    return;
  }
  for (const decorator of decorators) {
    const name = decoratorName(decorator);
    if (name !== null && QUERY_DECORATORS.has(name)) {
      context.report({ node: decorator, messageId: "decorator", data: { name } });
    }
  }
}

/**
 * `no-query-decorators` — rejects `@query`, `@queryAll`, `@queryAsync`,
 * `@queryAssignedElements`, and `@queryAssignedNodes`, and their imports from
 * the Lit decorator modules.
 *
 * A query decorator is a selector against the render root, evaluated lazily,
 * with no compile-time link to the template. A `ref` has one.
 */
export const noQueryDecoratorsRule: LitRule = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Disallow the Lit `@query` decorators and their imports",
      url: docsUrl("no-query-decorators"),
    },
    schema: [],
    messages: {
      decorator: "Unexpected query decorator `@{{name}}`.",
      import: "Unexpected import of query decorator `{{name}}`.",
    },
  },
  create(context) {
    return {
      ImportDeclaration(node: TSESTree.ImportDeclaration): void {
        if (!DECORATOR_SOURCES.has(node.source.value)) {
          return;
        }
        for (const specifier of node.specifiers) {
          if (specifier.type !== "ImportSpecifier") {
            continue;
          }
          const name = keyName(specifier.imported);
          if (name !== null && QUERY_DECORATORS.has(name)) {
            context.report({ node: specifier, messageId: "import", data: { name } });
          }
        }
      },
      PropertyDefinition(node: TSESTree.PropertyDefinition): void {
        checkMember(context, node, node.decorators);
      },
      AccessorProperty(node: TSESTree.AccessorProperty): void {
        checkMember(context, node, node.decorators);
      },
      MethodDefinition(node: TSESTree.MethodDefinition): void {
        checkMember(context, node, node.decorators);
      },
    };
  },
};
