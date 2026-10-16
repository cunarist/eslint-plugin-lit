import { spanOf, testRule } from "#testing";

import { lifecycleSuperRule } from "./lifecycle-super.ts";

const LIT = 'import { html, LitElement } from "lit";\n';

const MISSING = { messageId: "missing" };

const highlightCode = `${LIT}class El extends LitElement {
  connectedCallback() { this.setup(); }
}`;

testRule("lifecycle-super", lifecycleSuperRule, {
  valid: [
    // allows overrides that chain to super
    `${LIT}class El extends LitElement {
      connectedCallback() { super.connectedCallback(); this.setup(); }
      disconnectedCallback() { this.teardown(); super.disconnectedCallback(); }
      update(changed) { super.update(changed); }
      willUpdate(changed) { super.willUpdate(changed); }
    }`,

    // allows a conditional super call
    `${LIT}class El extends LitElement {
      updated(changed) {
        if (changed.size) { super.updated(changed); }
      }
    }`,

    // ignores non-lifecycle methods
    `${LIT}class El extends LitElement {
      render() { return html\`\`; }
      handleClick() {}
    }`,

    // ignores non-Lit classes
    `class Plain extends HTMLElement {
      connectedCallback() { this.setup(); }
    }`,

    // ignores hooks whose base implementation is empty, which exist to be
    // overridden without chaining
    `${LIT}class El extends LitElement {
      willUpdate() {}
      firstUpdated() {}
      updated() {}
      shouldUpdate() { return true; }
    }`,

    // accepts a super call from a nested block
    `${LIT}class El extends LitElement {
      attributeChangedCallback(name, old, value) {
        try { super.attributeChangedCallback(name, old, value); } catch {}
      }
    }`,
  ],
  invalid: [
    // rejects a missing super call, highlighting the method name
    {
      code: highlightCode,
      errors: [
        {
          ...MISSING,
          data: { name: "connectedCallback" },
          ...spanOf(highlightCode, "connectedCallback"),
          suggestions: [
            {
              messageId: "callSuper",
              output: `${LIT}class El extends LitElement {
  connectedCallback() { super.connectedCallback();
                        this.setup(); }
}`,
            },
          ],
        },
      ],
    },

    // rejects a super call to a different method
    {
      code: `${LIT}class El extends LitElement {
      connectedCallback() { super.disconnectedCallback(); }
    }`,
      errors: [
        {
          ...MISSING,
          suggestions: [
            {
              messageId: "callSuper",
              output: `${LIT}class El extends LitElement {
      connectedCallback() { super.connectedCallback();
                            super.disconnectedCallback(); }
    }`,
            },
          ],
        },
      ],
    },

    // reports each unchained override, forwarding its parameters
    {
      code: `${LIT}class El extends LitElement {
      connectedCallback() {}
      disconnectedCallback() {}
      update(changed) {}
    }`,
      errors: [
        {
          ...MISSING,
          suggestions: [
            {
              messageId: "callSuper",
              output: `${LIT}class El extends LitElement {
      connectedCallback() { super.connectedCallback(); }
      disconnectedCallback() {}
      update(changed) {}
    }`,
            },
          ],
        },
        {
          ...MISSING,
          suggestions: [
            {
              messageId: "callSuper",
              output: `${LIT}class El extends LitElement {
      connectedCallback() {}
      disconnectedCallback() { super.disconnectedCallback(); }
      update(changed) {}
    }`,
            },
          ],
        },
        {
          ...MISSING,
          suggestions: [
            {
              messageId: "callSuper",
              output: `${LIT}class El extends LitElement {
      connectedCallback() {}
      disconnectedCallback() {}
      update(changed) { super.update(changed); }
    }`,
            },
          ],
        },
      ],
    },

    // suggests nothing when a parameter cannot be forwarded
    {
      code: `${LIT}class El extends LitElement {
      attributeChangedCallback([name]) {}
    }`,
      errors: [{ ...MISSING, suggestions: [] }],
    },
  ],
});
