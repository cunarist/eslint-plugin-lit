import type { SuggestedEdit } from "@eslint/core";
import type { TSESTree } from "@typescript-eslint/types";

import {
  bindingPlaceholder,
  docsUrl,
  isHtmlTemplate,
  isTaggedWith,
  type LitRule,
  type LitRuleContext,
  type ParsedElement,
  parseTemplate,
  placeholderIndices,
  rangeLoc,
  type SourceRange,
  type TemplateSource,
  templateSource,
  walkElements,
} from "#helpers";

/** The HTML namespace; anything else is foreign content. */
const HTML_NAMESPACE = "http://www.w3.org/1999/xhtml";

/** Sigils that mark a binding Lit resolves itself. */
const SIGILS = ".@?";

/** Owned by `no-jsx-attribute-names`, which gives a better message. */
const JSX_NAMES: ReadonlySet<string> = new Set(["classname", "htmlfor"]);

/** Whether an attribute's `=…` part is exactly one binding, quoted or not. */
function isSingleBinding(value: string): boolean {
  const unquoted = value.trim().replaceAll(/^(["'])(.*)\1$/gu, "$2");
  const indices = placeholderIndices(unquoted);
  const [index] = indices;
  return indices.length === 1 && index !== undefined && unquoted === bindingPlaceholder(index);
}

/** An attribute this rule reports: its name, where the name sits, and its value. */
interface FlaggedAttribute {
  name: string;
  range: SourceRange;
  /** Whether the value after `=` is exactly one binding. */
  bound: boolean;
}

/** The name part of an attribute's raw source, everything before its `=`. */
function attributeName(raw: string): string {
  const equals = raw.indexOf("=");
  return equals === -1 ? raw : raw.slice(0, equals);
}

/** Whether an attribute's raw source has a value that is exactly one binding. */
function isBound(raw: string): boolean {
  const equals = raw.indexOf("=");
  return equals !== -1 && isSingleBinding(raw.slice(equals + 1));
}

/**
 * Whether `name` is a plain attribute name with uppercase letters or an
 * underscore, leaving sigil bindings, odd names, and JSX names alone.
 */
function isFlaggedName(name: string): boolean {
  if (name.length === 0 || SIGILS.includes(name.charAt(0))) {
    return false;
  }
  if (!/^[a-zA-Z][a-zA-Z0-9_-]*$/u.test(name)) {
    return false;
  }
  if (name !== name.toLowerCase()) {
    return !JSX_NAMES.has(name.toLowerCase());
  }
  return name.includes("_");
}

/** Reports an attribute name with uppercase letters, suggesting lowercase or a property. */
function reportUppercase(context: LitRuleContext, attribute: FlaggedAttribute): void {
  const { name, range, bound } = attribute;
  const lowercase = name.toLowerCase();
  const lowercaseFix: SuggestedEdit = {
    messageId: "lowercase",
    data: { lowercase },
    fix: (fixer) => fixer.replaceTextRange(range, lowercase),
  };
  context.report({
    loc: rangeLoc(context.sourceCode, range),
    messageId: "uppercase",
    data: { name },
    suggest: bound
      ? [
          lowercaseFix,
          {
            messageId: "property",
            data: { name },
            fix: (fixer) => fixer.insertTextBeforeRange(range, "."),
          },
        ]
      : [lowercaseFix],
  });
}

/** Reports a snake_case attribute name, suggesting kebab-case. */
function reportSnakeCase(context: LitRuleContext, attribute: FlaggedAttribute): void {
  const { name, range } = attribute;
  const kebab = name.replaceAll("_", "-");
  context.report({
    loc: rangeLoc(context.sourceCode, range),
    messageId: "snakeCase",
    data: { name },
    suggest: [
      {
        messageId: "kebab",
        data: { kebab },
        fix: (fixer) => fixer.replaceTextRange(range, kebab),
      },
    ],
  });
}

/** Checks every attribute of one HTML element in the template. */
function checkElement(
  context: LitRuleContext,
  source: TemplateSource,
  element: ParsedElement,
): void {
  if (element.namespaceURI !== HTML_NAMESPACE) {
    return;
  }
  const locations = element.sourceCodeLocation?.attrs;
  if (locations === undefined) {
    return;
  }
  for (const location of Object.values(locations)) {
    const raw = source.text.slice(location.startOffset, location.endOffset);
    const name = attributeName(raw);
    if (!isFlaggedName(name)) {
      continue;
    }
    const attribute: FlaggedAttribute = {
      name,
      range: source.toSourceRange(location.startOffset, location.startOffset + name.length),
      bound: isBound(raw),
    };
    if (name === name.toLowerCase()) {
      reportSnakeCase(context, attribute);
    } else {
      reportUppercase(context, attribute);
    }
  }
}

/**
 * `no-camelcase-attribute` — rejects an attribute name in an `html` template
 * that is not kebab-case: one with uppercase letters or an underscore.
 *
 * The HTML parser lowercases every attribute name, so `<x-y myProp=${v}>` sets
 * an attribute called `myprop`, and a component that declares `myProp` never
 * sees it. Only plain attributes are checked: `.myProp=`, `@myEvent=`, and
 * `?myFlag=` are resolved by Lit and stay case-sensitive. Foreign content is
 * skipped too, since SVG really has `viewBox` and friends.
 */
export const noCamelcaseAttributeRule: LitRule = {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow uppercase letters and underscores in `html` template attribute names",
      url: docsUrl("no-camelcase-attribute"),
    },
    hasSuggestions: true,
    schema: [],
    messages: {
      uppercase: "Attribute `{{name}}` has uppercase letters.",
      snakeCase: "Attribute `{{name}}` uses snake_case.",
      lowercase: "Write the attribute as `{{lowercase}}`.",
      property: "Bind the property instead with `.{{name}}=`.",
      kebab: "Write the attribute as `{{kebab}}`.",
    },
  },
  create(context) {
    return {
      TaggedTemplateExpression(node: TSESTree.TaggedTemplateExpression): void {
        if (!isHtmlTemplate(node, context)) {
          return;
        }
        // An `svg` template is foreign content throughout, but parse5 parses
        // it as an HTML fragment and cannot know that.
        if (isTaggedWith(node, "svg", context)) {
          return;
        }
        const source = templateSource(node);
        walkElements(parseTemplate(source.text), (element: ParsedElement) => {
          checkElement(context, source, element);
        });
      },
    };
  },
};
