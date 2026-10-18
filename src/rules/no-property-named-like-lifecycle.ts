import type { TSESTree } from "@typescript-eslint/types";

import {
  classMembers,
  type ClassNode,
  docsUrl,
  isLitComponent,
  keyName,
  LIT_LIFECYCLE_MEMBERS,
  type LitRule,
  objectKeyName,
  staticPropertiesEntries,
} from "#helpers";

/** Whether a name collides with a Lit lifecycle member. */
function isLifecycleName(name: string): boolean {
  return LIT_LIFECYCLE_MEMBERS.includes(name);
}

/**
 * `no-property-named-like-lifecycle` — rejects a class field or reactive
 * property named after a Lit lifecycle member.
 *
 * A field is an own property installed at construction, so it hides the
 * prototype method rather than overriding it, and Lit then calls the field.
 * Methods are untouched: overriding a lifecycle method is the supported way to
 * hook it.
 */
export const noPropertyNamedLikeLifecycleRule: LitRule = {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow fields and reactive properties named after Lit lifecycle members",
      url: docsUrl("no-property-named-like-lifecycle"),
    },
    schema: [],
    messages: {
      lifecycle: 'Unexpected property "{{name}}", which shadows a Lit lifecycle method.',
    },
  },
  create(context) {
    function report(node: TSESTree.Node, name: string): void {
      context.report({ node, messageId: "lifecycle", data: { name } });
    }

    function check(node: ClassNode): void {
      if (!isLitComponent(node, context)) {
        return;
      }
      for (const member of classMembers(node)) {
        if (member.type === "PropertyDefinition" && member.static) {
          // `static properties` may still name a lifecycle member.
          for (const entry of staticPropertiesEntries(member)) {
            const name = objectKeyName(entry.key);
            if (name !== null && isLifecycleName(name)) {
              report(entry.key, name);
            }
          }
          continue;
        }
        if (member.type !== "PropertyDefinition" && member.type !== "AccessorProperty") {
          continue;
        }
        // `declare` is type-only and emits nothing, so it shadows nothing.
        if (member.type === "PropertyDefinition" && member.declare) {
          continue;
        }
        const name = keyName(member.key);
        if (name !== null && isLifecycleName(name)) {
          report(member.key, name);
        }
      }
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
