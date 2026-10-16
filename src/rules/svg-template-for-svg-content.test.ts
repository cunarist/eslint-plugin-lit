import { spanOf, testRule } from "#testing";

import { svgTemplateForSvgContentRule } from "./svg-template-for-svg-content.ts";

const LIT = 'import { html, svg } from "lit";\n';

/** An expected report on a bare `<tag>`. */
function bare(tag: string): { messageId: string; data: { tag: string } } {
  return { messageId: "bare", data: { tag } };
}

const nestedCode = `${LIT}const t = html\`<div><path d="M0 0"></path></div>\`;`;
const boundCode = `${LIT}const t = html\`<path d=\${this.d}></path>\`;`;

testRule("svg-template-for-svg-content", svgTemplateForSvgContentRule, {
  valid: [
    // allows a complete svg element
    `${LIT}const t = html\`<svg><path></path></svg>\`;`,
    `${LIT}const t = html\`<svg><g><circle></circle></g></svg>\`;`,
    // allows svg templates
    `${LIT}const t = svg\`<path></path>\`;`,
    `${LIT}const t = svg\`<circle></circle>\`;`,
    // allows plain html
    `${LIT}const t = html\`<div><span></span></div>\`;`,
    `${LIT}const t = html\`<a href=\${this.href}>x</a>\`;`,
    `${LIT}const t = html\`<title>x</title>\`;`,
    // ignores non-Lit templates
    "const t = sql`<path></path>`;",
  ],
  invalid: [
    // rejects a bare svg child, highlighting a start tag holding a binding
    { code: boundCode, errors: [{ ...bare("path"), ...spanOf(boundCode, "<path d=${this.d}>") }] },
    { code: `${LIT}const t = html\`<path></path>\`;`, errors: [bare("path")] },
    { code: `${LIT}const t = html\`<circle></circle>\`;`, errors: [bare("circle")] },
    { code: `${LIT}const t = html\`<rect></rect>\`;`, errors: [bare("rect")] },
    // rejects one nested under html elements, highlighting its start tag
    { code: nestedCode, errors: [{ ...bare("path"), ...spanOf(nestedCode, '<path d="M0 0">') }] },
    { code: `${LIT}const t = html\`<div><polygon></polygon></div>\`;`, errors: [bare("polygon")] },
    // reports each bare element
    {
      code: `${LIT}const t = html\`<path></path><circle></circle>\`;`,
      errors: [bare("path"), bare("circle")],
    },
  ],
});
