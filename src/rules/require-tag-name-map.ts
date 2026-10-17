import type { RuleTextEdit, RuleTextEditor, SuggestedEdit } from "@eslint/core";
import type { TSESTree } from "@typescript-eslint/types";

import {
  classDecorators,
  type ClassNode,
  customElementTag,
  docsUrl,
  isLitComponent,
  type LitRule,
  type LitRuleContext,
  memberPath,
} from "#helpers";

/** A component awaiting its tag-name-map entry. */
interface Registration {
  tag: string;
  className: string | null;
  node: TSESTree.Node;
}

/** What a tag-name-map entry maps its tag to. */
interface Entry {
  /** The mapped type name, e.g. `PathBar`, when it is a plain name. */
  typeName: string | null;
  /** The node naming that type, for a suggestion to rename it. */
  node: TSESTree.Identifier | null;
}

/** The `"x-y"` literal node passed to `@customElement`, for reporting. */
function customElementTagNode(node: ClassNode): TSESTree.StringLiteral | null {
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

/** What a tag-name-map entry maps to, e.g. `PathBar`. */
function entryOf(member: TSESTree.TSPropertySignature): Entry {
  const annotation = member.typeAnnotation?.typeAnnotation;
  if (annotation?.type !== "TSTypeReference" || annotation.typeName.type !== "Identifier") {
    return { typeName: null, node: null };
  }
  return { typeName: annotation.typeName.name, node: annotation.typeName };
}

/** The registration of a Lit component with `@customElement`, or `null`. */
function registrationOf(context: LitRuleContext, node: ClassNode): Registration | null {
  if (!isLitComponent(node, context)) {
    return null;
  }
  const tag = customElementTag(node);
  if (tag === null) {
    return null;
  }
  return {
    tag,
    className: node.id?.name ?? null,
    node: customElementTagNode(node) ?? node,
  };
}

/**
 * The edit that appends a tag-name-map entry to `text`. A file with a Lit
 * component imports Lit, so it is a module, where `declare global` is allowed.
 */
function addEntry(text: string, tag: string, className: string): SuggestedEdit {
  const end = text.length;
  const lead = text.endsWith("\n") ? "\n" : "\n\n";
  const augmentation = [
    "declare global {",
    "  interface HTMLElementTagNameMap {",
    `    ${JSON.stringify(tag)}: ${className};`,
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

/** Reports a registration whose entry is missing or maps another class. */
function check(
  context: LitRuleContext,
  entries: ReadonlyMap<string, Entry>,
  { tag, className, node }: Registration,
): void {
  const entry = entries.get(tag);
  if (entry === undefined) {
    context.report({
      node,
      messageId: "missingEntry",
      data: { tag },
      suggest: className === null ? [] : [addEntry(context.sourceCode.text, tag, className)],
    });
    return;
  }
  const { typeName: mapped, node: typeNode } = entry;
  if (className === null || mapped === null || typeNode === null || mapped === className) {
    return;
  }
  context.report({
    node,
    messageId: "wrongClass",
    data: { tag, mapped, className },
    suggest: [
      {
        messageId: "mapToClass",
        data: { className },
        fix: (fixer: RuleTextEditor): RuleTextEdit => fixer.replaceText(typeNode, className),
      },
    ],
  });
}

/** Records every string-keyed entry of an `HTMLElementTagNameMap` interface. */
function collectEntries(node: TSESTree.TSInterfaceDeclaration, entries: Map<string, Entry>): void {
  for (const member of node.body.body) {
    if (
      member.type === "TSPropertySignature" &&
      member.key.type === "Literal" &&
      typeof member.key.value === "string"
    ) {
      entries.set(member.key.value, entryOf(member));
    }
  }
}

/**
 * `require-tag-name-map` — a class registered with `@customElement("x-y")`
 * must also augment `HTMLElementTagNameMap` in the same file, so
 * `document.querySelector("x-y")` and template type checking know the element
 * type.
 */
export const requireTagNameMapRule: LitRule = {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Require an `HTMLElementTagNameMap` entry for every `@customElement` registration",
      url: docsUrl("require-tag-name-map"),
    },
    hasSuggestions: true,
    schema: [],
    messages: {
      missingEntry: 'No HTMLElementTagNameMap entry for "{{tag}}".',
      wrongClass: 'HTMLElementTagNameMap maps "{{tag}}" to `{{mapped}}`, not `{{className}}`.',
      addEntry: "Declare the tag on `HTMLElementTagNameMap` at the end of the file.",
      mapToClass: "Map the tag to `{{className}}`.",
    },
  },
  create(context) {
    /** Tag to mapped type, for every `HTMLElementTagNameMap` entry. */
    const entries = new Map<string, Entry>();
    const registrations: Registration[] = [];

    function collect(node: ClassNode): void {
      const registration = registrationOf(context, node);
      if (registration !== null) {
        registrations.push(registration);
      }
    }

    return {
      TSInterfaceDeclaration(node: TSESTree.TSInterfaceDeclaration): void {
        if (node.id.name === "HTMLElementTagNameMap") {
          collectEntries(node, entries);
        }
      },
      ClassDeclaration(node: TSESTree.ClassDeclaration): void {
        collect(node);
      },
      ClassExpression(node: TSESTree.ClassExpression): void {
        collect(node);
      },
      "Program:exit"(): void {
        for (const registration of registrations) {
          check(context, entries, registration);
        }
      },
    };
  },
};
