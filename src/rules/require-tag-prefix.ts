import type { TSESTree } from "@typescript-eslint/types";

import {
  classDecorators,
  type ClassNode,
  customElementTag,
  docsUrl,
  isLitComponent,
  kebabToPascal,
  type LitRule,
  type LitRuleContext,
} from "#helpers";

/** The `"x-y"` literal passed to a class decorator, for reporting. */
function tagNode(node: ClassNode): TSESTree.Node | null {
  for (const decorator of classDecorators(node)) {
    const expression = decorator.expression;
    if (expression.type !== "CallExpression") {
      continue;
    }
    const first = expression.arguments[0];
    if (first?.type === "Literal" && typeof first.value === "string") {
      return first;
    }
  }
  return null;
}

/**
 * Whether the tag carries a namespace segment ahead of the class name.
 *
 * The prefix itself is not known, since the rule takes no options, so the test
 * is whether any leading segments remain once the class name is accounted for.
 */
function hasPrefix(tag: string, className: string): boolean {
  const segments = tag.split("-").filter((segment) => segment.length > 0);
  const bare = className.replace(/Element$/u, "");
  for (let start = 1; start < segments.length; start += 1) {
    const rest = kebabToPascal(segments.slice(start).join("-"));
    if (rest === className || rest === bare) {
      return true;
    }
  }
  return false;
}

/** Reports a registered tag without a prefix. */
function check(context: LitRuleContext, node: ClassNode): void {
  if (!isLitComponent(node, context)) {
    return;
  }
  const tag = customElementTag(node);
  const id = node.id;
  if (tag === null || id === null || hasPrefix(tag, id.name)) {
    return;
  }
  context.report({ node: tagNode(node) ?? id, messageId: "noPrefix", data: { tag } });
}

/**
 * `require-tag-prefix` — requires a custom element name to carry a namespace
 * prefix.
 *
 * A custom element name is global to the page. Without a namespace segment two
 * libraries that both ship a `<button-group>` cannot be used together, and the
 * second registration throws.
 */
export const requireTagPrefixRule: LitRule = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Require a namespace prefix in custom element names",
      url: docsUrl("require-tag-prefix"),
    },
    schema: [],
    messages: {
      noPrefix: 'Custom element name "{{tag}}" carries no prefix.',
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
