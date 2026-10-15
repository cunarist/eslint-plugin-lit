import { spanOf, testRule } from "#testing";

import { hostConstructorRule } from "./host-constructor.ts";

const MISSING = { messageId: "missingConstructor" };
const COUNT = { messageId: "parameterCount", data: { count: "2" } };
const NAME = { messageId: "parameterName" };
const TYPE = { messageId: "hostType" };

const missingCode = "class BarController implements ReactiveController {}";

const extraCode =
  "class BarController implements ReactiveController {\n  constructor(host: ReactiveControllerHost, count: number) {}\n}";

const misnamedCode =
  "class BarController implements ReactiveController {\n  constructor(owner: ReactiveControllerHost) {}\n}";

const optionalCode = `class BarController implements ReactiveController {
  constructor(host?: ReactiveControllerHost) {}
}`;

testRule("host-constructor", hostConstructorRule, {
  valid: [
    // allows the canonical constructor
    `class BarController implements ReactiveController {
      constructor(host: ReactiveControllerHost) {
        host.addController(this);
      }
    }`,

    // ignores non-controllers
    "class Store { constructor(a: number, b: number) {} }",

    // does not dictate the storage field: sibling rules find whatever field
    // the host lands in, so any name is allowed here
    `class C implements ReactiveController {
      #element;
      constructor(host: ReactiveControllerHost) {
        this.#element = host;
        host.addController(this);
      }
    }`,

    // accepts #host, and storing nothing
    `class C implements ReactiveController {
      #host;
      constructor(host: ReactiveControllerHost) {
        this.#host = host;
        host.addController(this);
      }
    }`,
    `class C implements ReactiveController {
      constructor(host: ReactiveControllerHost) {
        host.addController(this);
      }
    }`,
  ],
  invalid: [
    // rejects a missing constructor, highlighting the class name
    {
      code: missingCode,
      errors: [{ ...MISSING, ...spanOf(missingCode, "BarController") }],
    },

    // rejects extra parameters, highlighting the parameter list
    {
      code: extraCode,
      errors: [{ ...COUNT, ...spanOf(extraCode, "host: ReactiveControllerHost, count: number") }],
    },

    // rejects a misnamed parameter, highlighting it with its type
    {
      code: misnamedCode,
      errors: [{ ...NAME, ...spanOf(misnamedCode, "owner: ReactiveControllerHost") }],
    },

    // rejects a wrong type
    {
      code: `class BarController implements ReactiveController {
      constructor(host: LitElement) {}
    }`,
      errors: [TYPE],
    },

    // rejects an untyped parameter
    {
      code: `class BarController implements ReactiveController {
      constructor(host) {}
    }`,
      errors: [TYPE],
    },

    // rejects an optional host, suggesting to make it required
    {
      code: optionalCode,
      errors: [
        {
          messageId: "optionalHost",
          ...spanOf(optionalCode, "host?: ReactiveControllerHost"),
          suggestions: [
            {
              messageId: "makeRequired",
              output: optionalCode.replace("host?", "host"),
            },
          ],
        },
      ],
    },
  ],
});
