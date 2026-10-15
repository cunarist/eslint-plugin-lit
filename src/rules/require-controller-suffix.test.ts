import { spanOf, testRule } from "#testing";

import { requireControllerSuffixRule } from "./require-controller-suffix.ts";

const bare = "class Items implements ReactiveController {}";

testRule("require-controller-suffix", requireControllerSuffixRule, {
  valid: [
    // accepts the suffix
    "class ItemsController implements ReactiveController {}",

    // ignores classes that are not controllers
    "class Items {}",
    'import { LitElement } from "lit";\nclass PathBar extends LitElement {}',
  ],
  invalid: [
    // rejects a bare name, highlighting the class name
    {
      code: bare,
      errors: [{ messageId: "suffix", data: { name: "Items" }, ...spanOf(bare, "Items") }],
    },
  ],
});
