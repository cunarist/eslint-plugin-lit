import { spanOf, testRule } from "#testing";

import { noManualUpdateRule } from "./no-manual-update.ts";

const IMPORT = 'import { LitElement } from "lit";\n';

const requestCode = `${IMPORT}class El extends LitElement { go() { this.requestUpdate(); } }`;

testRule("no-manual-update", noManualUpdateRule, {
  valid: [
    // allows a controller nudging its host
    `class ClockController implements ReactiveController {
      #host: ReactiveControllerHost;
      constructor(host: ReactiveControllerHost) {
        this.#host = host;
      }
      tick() {
        this.#host.requestUpdate();
      }
    }`,

    // allows a renamed host field in a controller
    `class ClockController implements ReactiveController {
      _host: ReactiveControllerHost;
      constructor(host: ReactiveControllerHost) {
        this._host = host;
      }
      tick() {
        this._host.requestUpdate();
      }
    }`,

    // ignores code outside a component
    "element.requestUpdate();",
    "class Store { go() { this.requestUpdate(); } }",

    // does not guess from Lit-like AST signals
    '@customElement("x-el") class El { go() { this.requestUpdate(); } }',
    "class El { render() { return html`<b></b>`; } go() { this.requestUpdate(); } }",
    "class El { static styles = css`:host{}`; go() { this.requestUpdate(); } }",

    // stays silent for an unresolved base
    "class El extends ImportedBase { go() { this.requestUpdate(); } }",

    // allows super delegation
    `${IMPORT}class El extends LitElement { performUpdate() { super.performUpdate(); } }`,

    // ignores unrelated methods on this
    `${IMPORT}class El extends LitElement { go() { this.render(); } }`,
  ],
  invalid: [
    // rejects a component scheduling itself, highlighting the callee
    {
      code: requestCode,
      errors: [
        {
          messageId: "manualUpdate",
          data: { name: "requestUpdate" },
          ...spanOf(requestCode, "this.requestUpdate"),
        },
      ],
    },
    ...["performUpdate", "scheduleUpdate"].map((name) => ({
      code: `${IMPORT}class El extends LitElement { go() { this.${name}(); } }`,
      errors: [{ messageId: "manualUpdate", data: { name } }],
    })),

    // follows a Lit base declared in the file
    {
      code: `${IMPORT}class Base extends LitElement {}
     class El extends Base { go() { this.requestUpdate(); } }`,
      errors: [{ messageId: "manualUpdate", data: { name: "requestUpdate" } }],
    },
  ],
});
