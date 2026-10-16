import { spanOf, testRule } from "#testing";

import { noPropertyAssignmentInConstructorRule } from "./no-property-assignment-in-constructor.ts";

const IMPORT = 'import { LitElement } from "lit";\n';

/** The expected report for an assignment to `name`. */
function assigned(name: string): { messageId: string; data: { name: string } } {
  return { messageId: "constructorAssignment", data: { name } };
}

const highlightCode = `${IMPORT}class El extends LitElement {
  @property() label = "";
  constructor() {
    super();
    this.label = "x";
  }
}`;

testRule("no-property-assignment-in-constructor", noPropertyAssignmentInConstructorRule, {
  valid: [
    // walks up to the root without crashing: `Program.parent` is null at runtime
    `${IMPORT}this.value = 1;`,

    // allows field initializers
    `${IMPORT}class El extends LitElement {
      @property() label = "";
      constructor() { super(); }
    }`,

    // allows non-reactive assignments
    `${IMPORT}class El extends LitElement {
      @property() label = "";
      #cache = null;
      constructor() {
        super();
        this.#cache = new Map();
        this.internal = 1;
      }
    }`,

    // allows assignment in other methods
    `${IMPORT}class El extends LitElement {
      @property() label = "";
      connectedCallback() { this.label = "x"; }
    }`,

    // allows assignment inside a callback
    `${IMPORT}class El extends LitElement {
      @property() label = "";
      constructor() {
        super();
        this.addEventListener("x", () => { this.label = "y"; });
      }
    }`,

    // ignores non-Lit classes
    `class Plain {
      @property() label = "";
      constructor() { this.label = "x"; }
    }`,
  ],
  invalid: [
    // rejects assigning a decorated property, highlighting the target
    {
      code: highlightCode,
      errors: [{ ...assigned("label"), ...spanOf(highlightCode, "this.label") }],
    },

    // rejects assigning a @state property
    {
      code: `${IMPORT}class El extends LitElement {
      @state() open = false;
      constructor() {
        super();
        this.open = true;
      }
    }`,
      errors: [assigned("open")],
    },

    // rejects a static properties entry
    {
      code: `${IMPORT}class El extends LitElement {
      static properties = { count: { type: Number } };
      constructor() {
        super();
        this.count = 0;
      }
    }`,
      errors: [assigned("count")],
    },

    // rejects a nested and a compound assignment
    {
      code: `${IMPORT}class El extends LitElement {
      @property({type: Number}) count = 0;
      constructor() {
        super();
        if (cond) { this.count = 1; }
        this.count += 2;
      }
    }`,
      errors: [assigned("count"), assigned("count")],
    },
  ],
});
