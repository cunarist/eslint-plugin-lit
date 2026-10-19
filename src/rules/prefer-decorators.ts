import type { TSESTree } from "@typescript-eslint/types";

import { type ClassNode, docsUrl, isLitComponent, keyName, type LitRule } from "#helpers";

/**
 * `prefer-decorators` - declare reactive properties with `@property` and
 * `@state`, not a `static properties` object. The decorator keeps the
 * declaration next to the field it configures and its TypeScript type.
 */
export const preferDecoratorsRule: LitRule = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Enforce `@property` and `@state` decorators over `static properties`",
      url: docsUrl("prefer-decorators"),
    },
    schema: [],
    messages: {
      staticProperties: "Unexpected `static properties` declaration of reactive properties.",
    },
  },
  create(context) {
    function check(node: ClassNode): void {
      if (!isLitComponent(node, context)) {
        return;
      }
      for (const member of node.body.body) {
        if (
          (member.type === "PropertyDefinition" ||
            member.type === "MethodDefinition" ||
            member.type === "AccessorProperty") &&
          member.static &&
          keyName(member.key) === "properties"
        ) {
          context.report({ node: member.key, messageId: "staticProperties" });
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
