import { spanOf, testRule } from "#testing";

import { noThisAssignInRenderRule } from "./no-this-assign-in-render.ts";

/** Appended rather than prepended, so the snippet's own offsets stay put. */
const IMPORTS =
  '\nimport { LitElement, html } from "lit";\nimport { ref } from "lit/directives/ref.js";';

const highlightCode = `class El extends LitElement {
  render() { this.count = 1; return html\`\`; }
}${IMPORTS}`;

testRule("no-this-assign-in-render", noThisAssignInRenderRule, {
  valid: [
    // allows reads and local assignment
    `class El extends LitElement {
  render() {
    const label = this.name;
    let count = 0;
    count += 1;
    return html\`<p>\${label}</p>\`;
  }
}${IMPORTS}`,

    // allows assignment in other methods
    `class El extends LitElement {
  willUpdate() { this.label = "x"; }
  render() { return html\`<p>\${this.label}</p>\`; }
}${IMPORTS}`,

    // ignores non-Lit classes
    `class Plain {
  render() { this.count = 1; }
}${IMPORTS}`,

    // allows a handler kept as a class field
    `class El extends LitElement {
  #onClick = () => { this.count++; };
  render() {
    return html\`<button @click=\${this.#onClick}>+</button>\`;
  }
}${IMPORTS}`,
  ],
  invalid: [
    // rejects assignment to this, highlighting the assignment
    {
      code: highlightCode,
      errors: [
        {
          messageId: "assign",
          data: { target: "this.count" },
          ...spanOf(highlightCode, "this.count = 1"),
        },
      ],
    },

    // rejects nested and computed targets
    {
      code: `class El extends LitElement {
  render() { this.state.count = 1; return html\`\`; }
}${IMPORTS}`,
      errors: [{ messageId: "assign", data: { target: "this.state.count" } }],
    },
    {
      code: `class El extends LitElement {
  render() { this.items[0] = 1; return html\`\`; }
}${IMPORTS}`,
      errors: [{ messageId: "assign", data: { target: "this" } }],
    },

    // rejects increment of this
    {
      code: `class El extends LitElement {
  render() { this.count++; return html\`\`; }
}${IMPORTS}`,
      errors: [{ messageId: "assign", data: { target: "this.count" } }],
    },

    // rejects assignment in a nested callback
    {
      code: `class El extends LitElement {
  render() { [1].forEach(() => { this.count = 1; }); return html\`\`; }
}${IMPORTS}`,
      errors: [{ messageId: "assign" }],
    },

    // reports a handler written inline: lexically inside render, so it fires;
    // simple-template-expressions rejects that form separately
    {
      code: `class El extends LitElement {
  render() {
    return html\`<button @click=\${() => this.count++}>+</button>\`;
  }
}${IMPORTS}`,
      errors: [{ messageId: "assign" }],
    },

    // known limit: a callback hoisted to a local still reports, since tracking
    // that it is only referenced from the template needs dataflow analysis
    {
      code: `class El extends LitElement {
  render() {
    const setInput = (el) => { this.input = el; };
    return html\`<input \${ref(setInput)}>\`;
  }
}${IMPORTS}`,
      errors: [{ messageId: "assign", data: { target: "this.input" } }],
    },
  ],
});
