import type { TSESTree } from "@typescript-eslint/types";

import type { ClassNode, LitRule } from "#helpers";
import { classDecorators, docsUrl, isLitComponent, memberPath } from "#helpers";

/** Names the spec reserves, which the registry rejects despite the hyphen. */
const RESERVED_NAMES: ReadonlySet<string> = new Set([
  "annotation-xml",
  "color-profile",
  "font-face",
  "font-face-src",
  "font-face-uri",
  "font-face-format",
  "font-face-name",
  "missing-glyph",
]);

/** Why the registry would reject this name, or null when it accepts it. */
function rejection(tag: string): string | null {
  if (!tag.includes("-")) {
    return "contains no hyphen";
  }
  if (!/^[a-z]/u.test(tag)) {
    return "does not start with a lowercase letter";
  }
  if (/[A-Z]/u.test(tag)) {
    return "contains an uppercase letter";
  }
  if (RESERVED_NAMES.has(tag)) {
    return "is reserved by the HTML spec";
  }
  return null;
}

/** The `"x-y"` literal passed to `@customElement`, if any. */
function tagLiteral(node: ClassNode): TSESTree.StringLiteral | null {
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

/**
 * `require-dashed-tag` — rejects a custom element name the registry will not
 * accept: one with no hyphen, uppercase, a leading non-letter, or a name the
 * spec reserves. `customElements.define()` throws on it, so the element never
 * exists.
 */
export const requireDashedTagRule: LitRule = {
  meta: {
    type: "problem",
    docs: {
      description: "Require custom element names that the registry accepts",
      url: docsUrl("require-dashed-tag"),
    },
    schema: [],
    messages: {
      invalid:
        'Custom element name "{{tag}}" {{reason}}, so `customElements.define()` throws and the element is never registered.',
    },
  },
  create(context) {
    function check(node: ClassNode): void {
      if (!isLitComponent(node, context)) {
        return;
      }
      const tag = tagLiteral(node);
      const reason = tag === null ? null : rejection(tag.value);
      if (tag === null || reason === null) {
        return;
      }
      context.report({ node: tag, messageId: "invalid", data: { tag: tag.value, reason } });
    }
    return {
      ClassDeclaration(node: TSESTree.ClassDeclaration): void {
        check(node);
      },
      ClassExpression(node: TSESTree.ClassExpression): void {
        check(node);
      },
    };
  },
};
