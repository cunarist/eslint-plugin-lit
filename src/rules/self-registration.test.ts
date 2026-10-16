import { spanOf, testRule } from "#testing";

import { selfRegistrationRule } from "./self-registration.ts";

const UNREGISTERED = { messageId: "unregistered" };

const missingCode =
  "class BarController implements ReactiveController {\n  constructor(host: ReactiveControllerHost) {}\n}";

const outsideCode = `class BarController implements ReactiveController {
  #host: ReactiveControllerHost;
  constructor(host: ReactiveControllerHost) {
    this.#host = host;
  }
  hostConnected(): void {
    this.#host.addController(this);
  }
}`;

const otherCode = `class BarController implements ReactiveController {
  constructor(host: ReactiveControllerHost) {
    host.addController(other);
  }
}`;

testRule("self-registration", selfRegistrationRule, {
  valid: [
    // allows host.addController(this)
    `class BarController implements ReactiveController {
      constructor(host: ReactiveControllerHost) {
        host.addController(this);
      }
    }`,

    // allows registering via a stored host
    `class BarController implements ReactiveController {
      #host: ReactiveControllerHost;
      constructor(host: ReactiveControllerHost) {
        this.#host = host;
        this.#host.addController(this);
      }
    }`,

    // allows registering via a renamed stored field
    `class BarController implements ReactiveController {
      _host: ReactiveControllerHost;
      constructor(host: ReactiveControllerHost) {
        this._host = host;
        this._host.addController(this);
      }
    }`,

    // allows registering via a renamed parameter
    `class BarController implements ReactiveController {
      constructor(controllerHost: ReactiveControllerHost) {
        controllerHost.addController(this);
      }
    }`,

    // ignores non-controllers
    "class Store { constructor() {} }",
  ],
  invalid: [
    // rejects a missing registration, highlighting the constructor keyword
    {
      code: missingCode,
      errors: [
        {
          ...UNREGISTERED,
          ...spanOf(missingCode, "constructor"),
          suggestions: [
            {
              messageId: "register",
              data: { host: "host" },
              output:
                "class BarController implements ReactiveController {\n  constructor(host: ReactiveControllerHost) {\n    host.addController(this);\n  }\n}",
            },
          ],
        },
      ],
    },

    // rejects registration outside the constructor
    {
      code: outsideCode,
      errors: [
        {
          ...UNREGISTERED,
          suggestions: [
            {
              messageId: "register",
              data: { host: "host" },
              output: outsideCode.replace(
                "this.#host = host;",
                "this.#host = host;\n    host.addController(this);",
              ),
            },
          ],
        },
      ],
    },

    // rejects registering something else
    {
      code: otherCode,
      errors: [
        {
          ...UNREGISTERED,
          suggestions: [
            {
              messageId: "register",
              data: { host: "host" },
              output: otherCode.replace(
                "host.addController(other);",
                "host.addController(other);\n    host.addController(this);",
              ),
            },
          ],
        },
      ],
    },
  ],
});
