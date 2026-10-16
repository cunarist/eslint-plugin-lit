import type { TSESTree } from "@typescript-eslint/types";

import type { ClassNode, LitRuleContext } from "#helpers";
import {
  docsUrl,
  findConstructor,
  isLitComponent,
  isReactiveController,
  type LitRule,
  typeReferenceName,
} from "#helpers";

/** A class in scope for the controller rules. */
function isControllerClass(node: ClassNode, context: LitRuleContext): boolean {
  return !isLitComponent(node, context) && isReactiveController(node);
}

/**
 * `host-constructor` — a reactive controller receives its host and nothing
 * else.
 *
 * Its constructor takes exactly one parameter, named `host`, typed
 * `ReactiveControllerHost`. Everything else the controller needs is handed to
 * it later, by the host.
 */
export const hostConstructorRule: LitRule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Require a reactive controller constructor to be exactly `constructor(host: ReactiveControllerHost)`",
      url: docsUrl("host-constructor"),
    },
    hasSuggestions: true,
    schema: [],
    messages: {
      missingConstructor:
        "Expected reactive controller to define `constructor(host: ReactiveControllerHost)`.",
      parameterCount:
        "Expected reactive controller constructor to take 1 parameter, `host: ReactiveControllerHost`, but found {{count}}.",
      parameterName: "Expected reactive controller constructor parameter to be named `host`.",
      optionalHost: "Unexpected optional `host` parameter in reactive controller constructor.",
      hostType:
        "Expected reactive controller `host` parameter to be typed `ReactiveControllerHost`.",
      makeRequired: "Make `host` required.",
    },
  },
  create(context) {
    /** Reports the first way a controller's constructor strays from the contract. */
    function check(node: ClassNode): void {
      if (!isControllerClass(node, context)) {
        return;
      }
      const constructor = findConstructor(node);
      if (constructor === null) {
        context.report({ node: node.id ?? node, messageId: "missingConstructor" });
        return;
      }
      const { params } = constructor.value;
      const [first] = params;
      const last = params.at(-1);
      if (params.length !== 1 || first === undefined || last === undefined) {
        context.report({
          ...(first === undefined || last === undefined
            ? { node: constructor.key }
            : { loc: { start: first.loc.start, end: last.loc.end } }),
          messageId: "parameterCount",
          data: { count: String(params.length) },
        });
        return;
      }
      if (first.type !== "Identifier" || first.name !== "host") {
        context.report({ node: first, messageId: "parameterName" });
        return;
      }
      if (first.optional) {
        const question = first.range[0] + first.name.length;
        context.report({
          node: first,
          messageId: "optionalHost",
          suggest: [
            {
              messageId: "makeRequired",
              fix: (fixer) => fixer.removeRange([question, question + 1]),
            },
          ],
        });
        return;
      }
      if (typeReferenceName(first.typeAnnotation ?? null) !== "ReactiveControllerHost") {
        context.report({ node: first, messageId: "hostType" });
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
