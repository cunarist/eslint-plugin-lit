import type { TSESTree } from "@typescript-eslint/types";

import {
  docsUrl,
  isHtmlTemplate,
  isTaggedWith,
  type LitRule,
  type LitRuleContext,
  type ParsedElement,
  parseTemplate,
  rangeLoc,
  type TemplateSource,
  templateSource,
  walkElements,
} from "#helpers";

/** The HTML namespace; anything else is foreign content. */
const HTML_NAMESPACE = "http://www.w3.org/1999/xhtml";

/** Elements that never have an end tag, where `/>` is harmless. */
const VOID_ELEMENTS: ReadonlySet<string> = new Set([
  "area",
  "base",
  "basefont",
  "br",
  "col",
  "embed",
  "frame",
  "hr",
  "img",
  "input",
  "keygen",
  "link",
  "meta",
  "param",
  "source",
  "track",
  "wbr",
]);

/** The tag name as written, after `<` and before any space, `/`, or `>`. */
const WRITTEN_NAME: RegExp = /^<([^\s/>]+)/u;

/**
 * Whether a start tag really ends in a self-closing slash.
 *
 * An unquoted attribute value swallows a trailing `/` (`<div a=${x}/>` binds
 * the value `…/` and is not self-closing), so the slash only counts when it
 * sits past the end of every attribute.
 */
function isSelfClosing(element: ParsedElement, text: string): boolean {
  const startTag = element.sourceCodeLocation?.startTag;
  if (startTag === undefined) {
    return false;
  }
  const slash = startTag.endOffset - 2;
  if (text[slash] !== "/") {
    return false;
  }
  return Object.values(element.sourceCodeLocation?.attrs ?? {}).every(
    (location) => location.endOffset <= slash,
  );
}

/** Reports a non-void HTML element written with a self-closing slash. */
function checkElement(
  context: LitRuleContext,
  source: TemplateSource,
  element: ParsedElement,
): void {
  const startTag = element.sourceCodeLocation?.startTag;
  const tag = element.tagName.toLowerCase();
  if (
    startTag === undefined ||
    element.namespaceURI !== HTML_NAMESPACE ||
    VOID_ELEMENTS.has(tag) ||
    !isSelfClosing(element, source.text)
  ) {
    return;
  }
  const written =
    WRITTEN_NAME.exec(source.text.slice(startTag.startOffset, startTag.endOffset))?.[1] ?? tag;
  // Replace the `/>` and the spaces before it, which are static text.
  let from = startTag.endOffset - 2;
  while (/\s/u.test(source.text.charAt(from - 1))) {
    from -= 1;
  }
  const fixRange: [number, number] = [
    source.toSourceOffset(from),
    source.toSourceOffset(startTag.endOffset - 1) + 1,
  ];
  context.report({
    loc: rangeLoc(
      context.sourceCode,
      source.toSourceRange(startTag.startOffset, startTag.endOffset),
    ),
    messageId: "selfClosing",
    data: { tag },
    suggest: [
      {
        messageId: "addEndTag",
        data: { tag: written },
        fix: (fixer) => fixer.replaceTextRange(fixRange, `></${written}>`),
      },
    ],
  });
}

/**
 * `no-self-closing-non-void` — rejects self-closing syntax on a non-void
 * element in a template.
 *
 * HTML has no self-closing syntax: `<div />` is a plain start tag, so what
 * follows becomes its children. Void elements and foreign content (SVG,
 * MathML, and every `svg` template) are left alone.
 */
export const noSelfClosingNonVoidRule: LitRule = {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow self-closing syntax on non-void HTML elements in templates",
      url: docsUrl("no-self-closing-non-void"),
    },
    hasSuggestions: true,
    schema: [],
    messages: {
      selfClosing: "Unexpected `<{{tag}} />`, which is not self-closing in HTML.",
      addEndTag: "Close the element right away with `</{{tag}}>`.",
    },
  },
  create(context) {
    return {
      TaggedTemplateExpression(node: TSESTree.TaggedTemplateExpression): void {
        // An `svg` template is foreign content throughout, but parse5 parses
        // it as an HTML fragment and cannot know that.
        if (!isHtmlTemplate(node, context) || isTaggedWith(node, "svg", context)) {
          return;
        }
        const source = templateSource(node);
        walkElements(parseTemplate(source.text), (element) => {
          checkElement(context, source, element);
        });
      },
    };
  },
};
