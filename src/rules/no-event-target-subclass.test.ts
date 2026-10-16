import { spanOf, testRule } from "#testing";

import { noEventTargetSubclassRule } from "./no-event-target-subclass.ts";

const storeCode = "class Store extends EventTarget {}";

testRule("no-event-target-subclass", noEventTargetSubclassRule, {
  valid: [
    // allows other base classes
    'import { LitElement } from "lit";\nclass El extends LitElement {}',
    "class C implements ReactiveController {}",

    // ignores indirect inheritance: LitElement reaches EventTarget through
    // HTMLElement, and only a direct `extends EventTarget` is a state bus
    "class El extends HTMLElement {}",
  ],
  invalid: [
    // rejects a state bus, highlighting the base class
    {
      code: storeCode,
      errors: [{ messageId: "eventTarget", ...spanOf(storeCode, "EventTarget") }],
    },
  ],
});
