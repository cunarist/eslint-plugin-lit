import type { TSESTree } from "@typescript-eslint/types";

import {
  classMembers,
  type ClassNode,
  docsUrl,
  isLitComponent,
  isReactiveProperty,
  keyName,
  type LitRule,
  objectKeyName,
  staticPropertiesEntries,
} from "#helpers";

/** Global attributes with existing platform semantics. */
const NATIVE_ATTRIBUTES: ReadonlySet<string> = new Set([
  "role",
  "title",
  "id",
  "slot",
  "style",
  "class",
  "hidden",
  "lang",
  "dir",
  "tabindex",
]);

/** Whether a name collides with a native global attribute. */
function isNative(name: string): boolean {
  return NATIVE_ATTRIBUTES.has(name.toLowerCase());
}

/**
 * `no-native-attributes` — rejects a reactive property named after a global
 * HTML attribute.
 *
 * Such a property replaces the accessor `HTMLElement` already defines, so
 * Lit's accessor and the platform's fight over `id`, `title`, `role` and the
 * rest, and the DOM, CSS and assistive technology stop behaving as expected.
 */
export const noNativeAttributesRule: LitRule = {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow reactive properties named after global HTML attributes",
      url: docsUrl("no-native-attributes"),
    },
    schema: [],
    messages: {
      native: 'Unexpected reactive property "{{name}}", which shadows a native HTML attribute.',
    },
  },
  create(context) {
    function report(node: TSESTree.Node, name: string): void {
      context.report({ node, messageId: "native", data: { name } });
    }

    function check(node: ClassNode): void {
      if (!isLitComponent(node, context)) {
        return;
      }
      for (const member of classMembers(node)) {
        if (member.type !== "PropertyDefinition" && member.type !== "AccessorProperty") {
          continue;
        }
        if (isReactiveProperty(member)) {
          const name = keyName(member.key);
          if (name !== null && isNative(name)) {
            report(member.key, name);
          }
          continue;
        }
        for (const entry of staticPropertiesEntries(member)) {
          const name = objectKeyName(entry.key);
          if (name !== null && isNative(name)) {
            report(entry.key, name);
          }
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
