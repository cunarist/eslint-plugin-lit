import { spanOf, testRule } from "#testing";

import { noInnerHtmlAssignmentRule } from "./no-inner-html-assignment.ts";

const highlightCode = "this.renderRoot.innerHTML = markup;";

testRule("no-inner-html-assignment", noInnerHtmlAssignmentRule, {
  valid: [
    // allows reading innerHTML
    "const markup = this.innerHTML;",
    "if (el.outerHTML === other) {}",

    // allows textContent
    "this.textContent = value;",
    "el.innerText = value;",

    // allows an unrelated property
    "this.innerHTMLCache = value;",
  ],
  invalid: [
    // rejects assigning this.innerHTML
    {
      code: "this.innerHTML = markup;",
      errors: [{ messageId: "assignment", data: { sink: "innerHTML", receiver: "this" } }],
    },

    // rejects assigning on any receiver
    {
      code: "el.innerHTML = markup;",
      errors: [{ messageId: "assignment", data: { sink: "innerHTML", receiver: "el" } }],
    },

    // rejects outerHTML
    {
      code: "el.outerHTML = markup;",
      errors: [{ messageId: "assignment", data: { sink: "outerHTML", receiver: "el" } }],
    },

    // rejects compound assignment
    { code: "this.innerHTML += markup;", errors: [{ messageId: "assignment" }] },

    // rejects a computed string key
    { code: 'el["innerHTML"] = markup;', errors: [{ messageId: "assignment" }] },

    // rejects assigning on a nested receiver, highlighting the target
    {
      code: highlightCode,
      errors: [
        {
          messageId: "assignment",
          data: { sink: "innerHTML", receiver: "this.renderRoot" },
          ...spanOf(highlightCode, "this.renderRoot.innerHTML"),
        },
      ],
    },
  ],
});
