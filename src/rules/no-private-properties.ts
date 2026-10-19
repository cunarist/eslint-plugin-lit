import type { TSESTree } from "@typescript-eslint/types";

import {
  classMembers,
  type ClassNode,
  docsUrl,
  findDecorator,
  isLitComponent,
  keyName,
  type LitRule,
  objectKeyName,
  staticPropertiesEntries,
} from "#helpers";

/**
 * Whether a member name is private. A leading underscore is only a
 * convention, which some codebases use for public fields, so it does not count.
 */
function isPrivateName(name: string): boolean {
  return name.startsWith("#");
}

/**
 * `no-private-properties` - rejects `@property` on a `#private` field.
 *
 * `@property` declares public API, an observed attribute anyone can set from
 * markup, which contradicts a private name. `@state` is the internal form.
 */
export const noPrivatePropertiesRule: LitRule = {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow declaring a private field as a public reactive property",
      url: docsUrl("no-private-properties"),
    },
    schema: [],
    messages: {
      private: 'Unexpected private field "{{name}}" declared as a public property.',
    },
  },
  create(context) {
    function report(node: TSESTree.Node, name: string): void {
      context.report({ node, messageId: "private", data: { name } });
    }

    function check(node: ClassNode): void {
      if (!isLitComponent(node, context)) {
        return;
      }
      for (const member of classMembers(node)) {
        if (member.type !== "PropertyDefinition" && member.type !== "AccessorProperty") {
          continue;
        }
        if (findDecorator(member.decorators, "property") !== null) {
          const name = keyName(member.key);
          if (name !== null && isPrivateName(name)) {
            report(member.key, name);
          }
          continue;
        }
        for (const entry of staticPropertiesEntries(member)) {
          const name = objectKeyName(entry.key);
          if (name !== null && isPrivateName(name)) {
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
