import { spanOf, testRule } from "#testing";

import { pairedLifecycleRule } from "./paired-lifecycle.ts";

const highlightCode =
  "class BarController implements ReactiveController {\n  hostConnected(): void {}\n}";

testRule("paired-lifecycle", pairedLifecycleRule, {
  valid: [
    // allows both hooks
    `class BarController implements ReactiveController {
      hostConnected(): void {}
      hostDisconnected(): void {}
    }`,

    // allows neither hook
    `class BarController implements ReactiveController {
      constructor(host: ReactiveControllerHost) {
        host.addController(this);
      }
    }`,

    // ignores non-controllers
    "class Store { load() {} }",
    'import { LitElement } from "lit";\nclass Bar extends LitElement { connectedCallback() {} }',

    // counts arrow-function fields
    `class BarController implements ReactiveController {
      hostConnected = (): void => {};
      hostDisconnected = (): void => {};
    }`,
  ],
  invalid: [
    // rejects hostConnected alone, highlighting the lone hook
    {
      code: highlightCode,
      errors: [
        {
          messageId: "unpaired",
          data: { present: "hostConnected", missing: "hostDisconnected" },
          ...spanOf(highlightCode, "hostConnected"),
        },
      ],
    },

    // rejects hostDisconnected alone
    {
      code: `class BarController implements ReactiveController {
      hostDisconnected(): void {}
    }`,
      errors: [
        { messageId: "unpaired", data: { present: "hostDisconnected", missing: "hostConnected" } },
      ],
    },
  ],
});
