import type { RuleTextEdit, RuleTextEditor, SuggestedEdit } from "@eslint/core";
import type { TSESTree } from "@typescript-eslint/types";

import {
  docsUrl,
  enclosingClass,
  isLitComponent,
  type LitRule,
  type LitRuleContext,
  memberPath,
} from "#helpers";

/** Event constructors whose first argument is the event name. */
const EVENT_CONSTRUCTORS: ReadonlySet<string> = new Set(["Event", "CustomEvent"]);

/** An event name awaiting its event-map entry. */
interface Dispatch {
  name: string;
  constructor: string;
  node: TSESTree.StringLiteral;
}

/** Last segment of a dotted path, e.g. `globalThis.Event` -> `Event`. */
function lastSegment(path: string | null): string | null {
  return path === null ? null : (path.split(".").pop() ?? path);
}

/**
 * The edit that appends an event-map entry to `text`. A file with a Lit
 * component imports Lit, so it is a module, where `declare global` is allowed.
 */
function suggestion(text: string, dispatch: Dispatch): SuggestedEdit {
  const end = text.length;
  const lead = text.endsWith("\n") ? "\n" : "\n\n";
  const augmentation = [
    "declare global {",
    "  interface HTMLElementEventMap {",
    `    ${JSON.stringify(dispatch.name)}: ${dispatch.constructor};`,
    "  }",
    "}",
    "",
  ].join("\n");
  return {
    messageId: "addEntry",
    fix: (fixer: RuleTextEditor): RuleTextEdit =>
      fixer.insertTextAfterRange([end, end], `${lead}${augmentation}`),
  };
}

/** Records every string-keyed entry of an `HTMLElementEventMap` interface. */
function collectDeclared(node: TSESTree.TSInterfaceDeclaration, declared: Set<string>): void {
  for (const member of node.body.body) {
    if (
      member.type === "TSPropertySignature" &&
      member.key.type === "Literal" &&
      typeof member.key.value === "string"
    ) {
      declared.add(member.key.value);
    }
  }
}

/** The event a Lit component constructs with a literal name, or `null`. */
function dispatchOf(context: LitRuleContext, node: TSESTree.NewExpression): Dispatch | null {
  const constructor = lastSegment(memberPath(node.callee));
  if (constructor === null || !EVENT_CONSTRUCTORS.has(constructor)) {
    return null;
  }
  const owner = enclosingClass(node);
  if (owner === null || !isLitComponent(owner, context)) {
    return null;
  }
  const first = node.arguments[0];
  if (first?.type !== "Literal" || typeof first.value !== "string") {
    return null;
  }
  return { name: first.value, constructor, node: first };
}

/**
 * `require-event-in-event-map` — an event a component constructs must have a
 * matching `HTMLElementEventMap` entry in the same file, so a listener for
 * that name is typed. Decided at the end of the file, because the
 * augmentation may sit either side of the class.
 */
export const requireEventInEventMapRule: LitRule = {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Require an `HTMLElementEventMap` entry for every event a Lit component constructs",
      url: docsUrl("require-event-in-event-map"),
    },
    hasSuggestions: true,
    schema: [],
    messages: {
      missingEntry: 'No HTMLElementEventMap entry for "{{name}}".',
      addEntry: "Declare the event on `HTMLElementEventMap` at the end of the file.",
    },
  },
  create(context) {
    /** Every event name declared on `HTMLElementEventMap` in this file. */
    const declared = new Set<string>();
    const dispatches: Dispatch[] = [];

    return {
      TSInterfaceDeclaration(node: TSESTree.TSInterfaceDeclaration): void {
        if (node.id.name === "HTMLElementEventMap") {
          collectDeclared(node, declared);
        }
      },
      NewExpression(node: TSESTree.NewExpression): void {
        const dispatch = dispatchOf(context, node);
        if (dispatch !== null) {
          dispatches.push(dispatch);
        }
      },
      "Program:exit"(): void {
        for (const dispatch of dispatches) {
          if (!declared.has(dispatch.name)) {
            context.report({
              node: dispatch.node,
              messageId: "missingEntry",
              data: { name: dispatch.name },
              suggest: [suggestion(context.sourceCode.text, dispatch)],
            });
          }
        }
      },
    };
  },
};
