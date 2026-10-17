import { type ExpectedError, spanOf, testRule } from "#testing";

import { noArrayMutationWithoutReassignRule } from "./no-array-mutation-without-reassign.ts";

const LIT =
  'import { LitElement } from "lit";\nimport { property, state } from "lit/decorators.js";\n';

const MUTATION = { messageId: "mutation" };

/** Every method the rule rejects, each called with no argument. */
const METHODS = [
  "push",
  "pop",
  "shift",
  "unshift",
  "splice",
  "sort",
  "reverse",
  "fill",
  "copyWithin",
];

/** A component that calls `method` on a reactive array. */
function callingMethod(method: string): string {
  return `${LIT}class El extends LitElement {
        @state() items = [];
        go() { this.items.${method}(); }
      }`;
}

/** What each rejected method reports, with the rewrite push and unshift get. */
function methodError(method: string): ExpectedError {
  if (method !== "push" && method !== "unshift") {
    return { ...MUTATION, data: { name: "items", method }, suggestions: [] };
  }
  return {
    ...MUTATION,
    data: { name: "items", method },
    suggestions: [
      {
        messageId: "reassign",
        output: callingMethod(method).replace(
          `this.items.${method}()`,
          "this.items = [...this.items]",
        ),
      },
    ],
  };
}

const highlightCode = `${LIT}class El extends LitElement {
  @state() items = [];
  add(item) { this.items.push(item); }
}`;

testRule("no-array-mutation-without-reassign", noArrayMutationWithoutReassignRule, {
  valid: [
    // allows replacing the array
    `${LIT}class El extends LitElement {
      @property({ type: Array }) items = [];
      add(item) { this.items = [...this.items, item]; }
    }`,

    // allows mutating a local array
    `${LIT}class El extends LitElement {
      @property({ type: Array }) items = [];
      add(item) {
        const next = [...this.items];
        next.push(item);
        this.items = next;
      }
    }`,

    // allows mutating a non-reactive field
    `${LIT}class El extends LitElement {
      cache = [];
      add(item) { this.cache.push(item); }
    }`,

    // allows non-mutating methods
    `${LIT}class El extends LitElement {
      @state() items = [];
      count() { return this.items.filter(Boolean).length; }
    }`,

    // ignores non-Lit classes
    `${LIT}class Plain {
      @property() items = [];
      add(item) { this.items.push(item); }
    }`,
  ],
  invalid: [
    // rejects push on a reactive property, highlighting the call
    {
      code: highlightCode,
      errors: [
        {
          ...MUTATION,
          ...spanOf(highlightCode, "this.items.push(item)"),
          suggestions: [
            {
              messageId: "reassign",
              output: highlightCode.replace(
                "this.items.push(item)",
                "this.items = [...this.items, item]",
              ),
            },
          ],
        },
      ],
    },

    // rejects every mutating method
    ...METHODS.map((method) => ({ code: callingMethod(method), errors: [methodError(method)] })),

    // rejects static properties entries, prepending for unshift
    {
      code: `${LIT}class El extends LitElement {
      static properties = { items: { type: Array } };
      add(item) { this.items.unshift(item, 2); }
    }`,
      errors: [
        {
          ...MUTATION,
          suggestions: [
            {
              messageId: "reassign",
              output: `${LIT}class El extends LitElement {
      static properties = { items: { type: Array } };
      add(item) { this.items = [item, 2, ...this.items]; }
    }`,
            },
          ],
        },
      ],
    },

    // suggests nothing when the call's result is read
    {
      code: `${LIT}class El extends LitElement {
      @state() items = [];
      add(item) { return this.items.push(item); }
    }`,
      errors: [{ ...MUTATION, suggestions: [] }],
    },
  ],
});
