import type { TSESTree } from "@typescript-eslint/types";

import type { LitRule, ParsedElement, ParsedNode } from "#helpers";
import {
  docsUrl,
  isElement,
  isTaggedWith,
  parseTemplate,
  rangeLoc,
  templateSource,
} from "#helpers";

/**
 * Elements that exist only in the SVG namespace, lowercased, because parse5
 * lowercases tag names in the HTML namespace, which is exactly the situation
 * this rule detects. Names shared with HTML (`title`, `a`, `style`, `script`,
 * `image`) are left out: they are legal in an `html` template on their own.
 */
const SVG_ONLY_ELEMENTS: ReadonlySet<string> = new Set([
  "animate",
  "animatemotion",
  "animatetransform",
  "circle",
  "clippath",
  "defs",
  "desc",
  "ellipse",
  "feblend",
  "fecolormatrix",
  "fegaussianblur",
  "femerge",
  "feoffset",
  "filter",
  "foreignobject",
  "g",
  "line",
  "lineargradient",
  "marker",
  "mask",
  "path",
  "pattern",
  "polygon",
  "polyline",
  "radialgradient",
  "rect",
  "stop",
  "symbol",
  "text",
  "textpath",
  "tspan",
  "use",
  "view",
]);

/**
 * `svg-template-for-svg-content` — rejects SVG-only elements written directly
 * in an `html` template with no enclosing `<svg>`.
 *
 * Lit parses an `html` template in the HTML namespace, so a bare `<path>`
 * becomes an HTML element named `path` that renders nothing. A complete
 * `<svg>…</svg>` is fine: the parser switches namespace at its start tag.
 */
export const svgTemplateForSvgContentRule: LitRule = {
  meta: {
    type: "problem",
    docs: {
      description: "Require SVG-only elements to sit in an `svg` template or an `<svg>` element",
      url: docsUrl("svg-template-for-svg-content"),
    },
    schema: [],
    messages: {
      bare: "SVG element `<{{tag}}>` in an `html` template is created in the HTML namespace and never renders; wrap it in `<svg>` or move it into an `svg` template.",
    },
  },
  create(context) {
    return {
      TaggedTemplateExpression(node: TSESTree.TaggedTemplateExpression): void {
        // `svg` templates are the fix, not the problem; `isHtmlTemplate` would
        // match those too.
        if (!isTaggedWith(node, "html", context)) {
          return;
        }
        const source = templateSource(node);

        const report = (element: ParsedElement): void => {
          const location = element.sourceCodeLocation;
          if (location === null || location === undefined) {
            return;
          }
          const span = location.startTag ?? location;
          context.report({
            loc: rangeLoc(
              context.sourceCode,
              source.toSourceRange(span.startOffset, span.endOffset),
            ),
            messageId: "bare",
            data: { tag: element.tagName },
          });
        };

        // Ancestry matters, so this walks by hand rather than through
        // `walkElements`: below an `<svg>` everything is in the right
        // namespace already.
        const visit = (nodes: readonly ParsedNode[]): void => {
          for (const child of nodes) {
            if (!isElement(child)) {
              continue;
            }
            const tagName = child.tagName.toLowerCase();
            if (tagName === "svg") {
              continue;
            }
            if (SVG_ONLY_ELEMENTS.has(tagName)) {
              report(child);
            }
            visit(child.childNodes);
          }
        };
        visit(parseTemplate(source.text).childNodes);
      },
    };
  },
};
