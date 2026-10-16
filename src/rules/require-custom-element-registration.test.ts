import { spanOf, testRule } from "#testing";

import { requireCustomElementRegistrationRule } from "./require-custom-element-registration.ts";

const IMPORT = 'import { LitElement, ReactiveElement } from "lit";\n';

/** The expected report for the class `name`. */
function unregistered(name: string): { messageId: string; data: { name: string } } {
  return { messageId: "unregistered", data: { name } };
}

const highlightCode = `${IMPORT}export class OneElement extends LitElement {}`;

testRule("require-custom-element-registration", requireCustomElementRegistrationRule, {
  valid: [
    // allows a decorated component
    `${IMPORT}@customElement("x-one")
    export class One extends LitElement {}`,

    // allows a define call
    `${IMPORT}export class One extends LitElement {}
    customElements.define("x-one", One);`,

    // allows an abstract base
    `${IMPORT}abstract class Base extends LitElement {}`,

    // allows an exported base extended here
    `${IMPORT}export class Base extends LitElement {}
    @customElement("x-one")
    export class One extends Base {}`,

    // ignores non-Lit classes
    "class Plain {}",
    "class Store extends EventTarget {}",
  ],
  invalid: [
    // rejects an unregistered component, highlighting the class name
    {
      code: highlightCode,
      errors: [{ ...unregistered("OneElement"), ...spanOf(highlightCode, "OneElement") }],
    },

    // rejects a non-exported unregistered component
    { code: `${IMPORT}class One extends LitElement {}`, errors: [unregistered("One")] },

    // rejects an unexported class extended here: only an exported base gets
    // the base-class exemption
    {
      code: `${IMPORT}class Base extends LitElement {}
    @customElement("x-one")
    export class One extends Base {}`,
      errors: [unregistered("Base")],
    },

    // reports each unregistered component
    {
      code: `${IMPORT}export class One extends LitElement {}
    export class Two extends ReactiveElement {}`,
      errors: [unregistered("One"), unregistered("Two")],
    },
  ],
});
