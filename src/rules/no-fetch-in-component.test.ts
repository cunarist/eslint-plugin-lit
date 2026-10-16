import { spanOf, testRule } from "#testing";

import { noFetchInComponentRule } from "./no-fetch-in-component.ts";

const FETCH = { messageId: "fetch" };

const componentCode = [
  'import { LitElement } from "lit";',
  "class PathBar extends LitElement {",
  "  async load() {",
  '    await fetch("/api");',
  "  }",
  "}",
].join("\n");

testRule("no-fetch-in-component", noFetchInComponentRule, {
  valid: [
    // allows fetch in a controller
    [
      "class DataController implements ReactiveController {",
      "  async load() {",
      '    await fetch("/api");',
      "  }",
      "}",
    ].join("\n"),

    // allows fetch at module scope
    'const data = await fetch("/api");',

    // allows a method named fetch on a member
    [
      'import { LitElement } from "lit";',
      "class PathBar extends LitElement {",
      "  #api;",
      "  load() {",
      '    this.#api.fetch("/api");',
      "  }",
      "}",
    ].join("\n"),
  ],
  invalid: [
    // rejects fetch in a component, highlighting the callee
    { code: componentCode, errors: [{ ...FETCH, ...spanOf(componentCode, "fetch") }] },

    // rejects a signalled fetch too
    {
      code: [
        'import { LitElement } from "lit";',
        "class PathBar extends LitElement {",
        "  #aborter;",
        "  async load() {",
        '    await fetch("/api", { signal: this.#aborter.signal });',
        "  }",
        "}",
      ].join("\n"),
      errors: [FETCH],
    },

    // catches a qualified fetch
    {
      code: [
        'import { ReactiveElement } from "lit";',
        "class PathBar extends ReactiveElement {",
        "  async load() {",
        '    await window.fetch("/api");',
        "  }",
        "}",
      ].join("\n"),
      errors: [FETCH],
    },
  ],
});
