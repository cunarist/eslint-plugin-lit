import { spanOf, testRule } from "#testing";

import { preferContextDecoratorsRule } from "./prefer-context-decorators.ts";

const LIT = 'import { LitElement } from "lit";\n';

/** The expected report for `name`, steered to `decorator`. */
function byHand(
  name: string,
  decorator: string,
): { messageId: string; data: { name: string; decorator: string } } {
  return { messageId: "byHand", data: { name, decorator } };
}

const providerCode = `${LIT}import { ContextProvider } from "@lit/context";
class El extends LitElement {
  #provider = new ContextProvider(this, { context: appContext });
}`;

testRule("prefer-context-decorators", preferContextDecoratorsRule, {
  valid: [
    // accepts the decorators
    `${LIT}class El extends LitElement {
      @provide({ context: appContext })
      accessor appState = initial;

      @consume({ context: appContext, subscribe: true })
      accessor consumed = initial;
    }`,

    // ignores non-Lit classes
    `import { ContextProvider } from "@lit/context";
    class Plain {
      provider = new ContextProvider(this, { context: appContext });
    }`,
  ],
  invalid: [
    // rejects a hand-built provider, highlighting the construction
    {
      code: providerCode,
      errors: [
        {
          ...byHand("ContextProvider", "@provide"),
          ...spanOf(providerCode, "new ContextProvider(this, { context: appContext })"),
        },
      ],
    },

    // rejects a hand-built consumer
    {
      code: `${LIT}import { ContextConsumer } from "@lit/context";
    class El extends LitElement {
      #consumer = new ContextConsumer(this, { context: appContext });
    }`,
      errors: [byHand("ContextConsumer", "@consume")],
    },

    // follows a renamed import
    {
      code: `${LIT}import { ContextProvider as Provider } from "@lit/context";
    class El extends LitElement {
      #provider = new Provider(this, { context: appContext });
    }`,
      errors: [byHand("Provider", "@provide")],
    },
  ],
});
