import type { TSESTree } from "@typescript-eslint/types";

import { docsUrl, type LitRule } from "#helpers";

/** Event names that are legitimately mixed-case in the platform. */
const ALLOWED_MIXED_CASE: ReadonlySet<string> = new Set(["DOMContentLoaded"]);

/** Constructors whose first argument is an event name. */
const EVENT_CONSTRUCTORS: ReadonlySet<string> = new Set(["Event", "CustomEvent"]);

/** Kebab-case form: camel humps and underscores turned into dashes. */
function kebabName(name: string): string {
  return name
    .replaceAll(/(?<lower>[a-z0-9])(?<upper>[A-Z])/gu, "$1-$2")
    .replaceAll("_", "-")
    .toLowerCase();
}

/**
 * `event-name-case` - requires the name given to `new CustomEvent(...)` or
 * `new Event(...)` to be kebab-case: no uppercase letters and no underscores.
 *
 * Event names are matched as plain strings, so `addEventListener("itemselected")`
 * silently never fires against an event dispatched as `"itemSelected"`.
 */
export const eventNameCaseRule: LitRule = {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Require kebab-case names for events created with `new CustomEvent()` or `new Event()`",
      url: docsUrl("event-name-case"),
    },
    hasSuggestions: true,
    schema: [],
    messages: {
      notKebab: 'Event name "{{name}}" is not kebab-case.',
      useKebab: 'Use "{{kebab}}" instead.',
    },
  },
  create(context) {
    return {
      NewExpression(node: TSESTree.NewExpression): void {
        const callee = node.callee;
        if (callee.type !== "Identifier" || !EVENT_CONSTRUCTORS.has(callee.name)) {
          return;
        }
        const first = node.arguments[0];
        if (first?.type !== "Literal") {
          return;
        }
        const name = first.value;
        if (typeof name !== "string" || ALLOWED_MIXED_CASE.has(name)) {
          return;
        }
        if (name === name.toLowerCase() && !name.includes("_")) {
          return;
        }
        const kebab = kebabName(name);
        // Rewriting the name renames the event for every listener, so it is
        // only offered, and only when the literal has no escapes to preserve.
        const raw = context.sourceCode.text.slice(first.range[0], first.range[1]);
        const quote = raw.charAt(0);
        const plain = raw === `${quote}${name}${quote}`;
        context.report({
          node: first,
          messageId: "notKebab",
          data: { name },
          suggest: plain
            ? [
                {
                  messageId: "useKebab",
                  data: { kebab },
                  fix: (fixer) => fixer.replaceText(first, `${quote}${kebab}${quote}`),
                },
              ]
            : [],
        });
      },
    };
  },
};
