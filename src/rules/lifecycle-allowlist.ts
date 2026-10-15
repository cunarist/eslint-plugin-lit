import type { TSESTree } from "@typescript-eslint/types";

import type { ClassNode, LitRule } from "#helpers";
import { docsUrl, isLitComponent, keyName } from "#helpers";

/** Lifecycle members a component may never override. */
const BANNED_LIFECYCLE: ReadonlySet<string> = new Set([
  "connectedCallback",
  "willUpdate",
  "disconnectedCallback",
  "firstUpdated",
  "updated",
  "shouldUpdate",
  "update",
  "performUpdate",
  "requestUpdate",
  "scheduleUpdate",
]);

/**
 * `lifecycle-allowlist` — on a Lit component only `styles` and `render` may be
 * overridden.
 *
 * Every other reactive-update lifecycle hook belongs in a `ReactiveController`,
 * where the work is paired with an explicit release.
 */
export const lifecycleAllowlistRule: LitRule = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Disallow Lit component lifecycle overrides other than `styles` and `render`",
      url: docsUrl("lifecycle-allowlist"),
    },
    schema: [],
    messages: {
      override:
        "Unexpected `{{name}}` override in a Lit component; move the work into a reactive controller.",
    },
  },
  create(context) {
    /** Reports every banned lifecycle member a Lit component defines. */
    function check(node: ClassNode): void {
      if (!isLitComponent(node, context)) {
        return;
      }
      for (const member of node.body.body) {
        if (
          member.type !== "MethodDefinition" &&
          member.type !== "PropertyDefinition" &&
          member.type !== "AccessorProperty"
        ) {
          continue;
        }
        const name = keyName(member.key);
        if (name === null || !BANNED_LIFECYCLE.has(name)) {
          continue;
        }
        context.report({ node: member.key, messageId: "override", data: { name } });
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
