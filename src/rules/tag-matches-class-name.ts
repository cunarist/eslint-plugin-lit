import type { TSESTree } from "@typescript-eslint/types";

import {
  type ClassNode,
  classDecorators,
  customElementTag,
  docsUrl,
  isLitComponent,
  kebabToPascal,
  type LitRule,
  type LitRuleContext,
  memberPath,
} from "#helpers";

/** The `"x-y"` literal passed to `@customElement`, for reporting. */
function customElementTagNode(node: ClassNode): TSESTree.Node | null {
  for (const decorator of classDecorators(node)) {
    const expression = decorator.expression;
    if (expression.type !== "CallExpression" || memberPath(expression.callee) !== "customElement") {
      continue;
    }
    const first = expression.arguments[0];
    if (first?.type === "Literal" && typeof first.value === "string") {
      return first;
    }
  }
  return null;
}

/** Whether some suffix of the tag's segments PascalCases to `className`. */
function suffixNames(tag: string, className: string): boolean {
  const segments = tag.split("-").filter((segment) => segment.length > 0);
  for (let start = 0; start < segments.length; start += 1) {
    if (kebabToPascal(segments.slice(start).join("-")) === className) {
      return true;
    }
  }
  return false;
}

/**
 * Whether the tag names the class, with or without a trailing `Element`, so
 * `PathBarElement` and `PathBar` both belong to `cl-path-bar`.
 */
function tagNamesClass(tag: string, className: string): boolean {
  if (suffixNames(tag, className)) {
    return true;
  }
  const withoutElement = className.replace(/Element$/u, "");
  return withoutElement !== className && suffixNames(tag, withoutElement);
}

/** Reports a registered tag that does not name its class. */
function check(context: LitRuleContext, node: ClassNode): void {
  if (!isLitComponent(node, context)) {
    return;
  }
  const tag = customElementTag(node);
  const className = node.id?.name;
  if (tag === null || className === undefined || className.length === 0) {
    return;
  }
  if (tagNamesClass(tag, className)) {
    return;
  }
  context.report({
    node: customElementTagNode(node) ?? node,
    messageId: "mismatch",
    data: { tag, className },
  });
}

/**
 * `tag-matches-class-name` — rejects a `@customElement` tag whose segments,
 * after any leading prefix, do not PascalCase to the class name, so
 * `cl-path-bar` belongs to `PathBar`.
 *
 * Any leading segments are accepted, since the prefix cannot be configured; the
 * rule still catches the real failure, a tag that names a different class.
 */
export const tagMatchesClassNameRule: LitRule = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Require a `@customElement` tag to name its class",
      url: docsUrl("tag-matches-class-name"),
    },
    schema: [],
    messages: {
      mismatch: 'Tag "{{tag}}" does not name class `{{className}}`.',
    },
  },
  create(context) {
    return {
      ClassDeclaration(node: TSESTree.ClassDeclaration): void {
        check(context, node);
      },
      ClassExpression(node: TSESTree.ClassExpression): void {
        check(context, node);
      },
    };
  },
};
