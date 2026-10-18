import { spanOf, testRule } from "#testing";

import { noSelfSyncRule } from "./no-self-sync.ts";

const LIT = 'import { html, LitElement } from "lit";\n';

const SELF_SYNC = { messageId: "selfSync" };

const highlightCode = `class ListController {
  syncItems() {}
  syncAll() { this.syncItems(); }
}`;

testRule("no-self-sync", noSelfSyncRule, {
  valid: [
    // allows a controller calling a private helper
    `class ListController {
      syncItems() { this.#apply(); }
      syncAll() { this.#apply(); }
      #apply() {}
    }`,

    // allows a private `#sync` prefixed helper
    `class ListController {
      syncAll() { this.#syncItems(); }
      #syncItems() {}
    }`,

    // allows the host syncing a controller
    `${LIT}class ListElement extends LitElement {
      #controller = new ListController(this);
      set items(value: string[]) { this.#controller.syncItems(value); }
      render() { return html\`\`; }
    }
    class ListController {
      constructor(_host: unknown) {}
      syncItems(_items: string[]) {}
    }`,

    // ignores a Lit component calling its own sync method
    `${LIT}class ListElement extends LitElement {
      syncItems() {}
      updated() { this.syncItems(); }
    }`,

    // ignores a component extending a local Lit component
    `${LIT}class BaseController extends LitElement {}
    class ListController extends BaseController {
      syncItems() {}
      updated() { this.syncItems(); }
    }`,

    // ignores plain classes
    `class Store {
      syncItems() {}
      load() { this.syncItems(); }
    }`,

    // ignores computed member calls
    `class ListController {
      syncItems() {}
      syncAll() { this["syncItems"](); }
    }`,

    // ignores calls on another receiver
    `class ListController {
      constructor(private other: ListController) {}
      syncAll() { this.other.syncItems(); }
      syncItems() {}
    }`,
  ],
  invalid: [
    // rejects a `*Controller` calling its own sync method, highlighting the call
    {
      code: highlightCode,
      errors: [
        {
          ...SELF_SYNC,
          data: { method: "syncItems" },
          ...spanOf(highlightCode, "this.syncItems()"),
        },
      ],
    },

    // rejects a class implementing ReactiveController
    {
      code: `import type { ReactiveController } from "lit";
      class Tracker implements ReactiveController {
        hostUpdate() { this.sync(); }
        sync() {}
      }`,
      errors: [{ ...SELF_SYNC, data: { method: "sync" } }],
    },

    // rejects a class defining a host hook
    {
      code: `class Tracker {
        hostConnected() { this.syncState(); }
        syncState() {}
      }`,
      errors: [{ ...SELF_SYNC, data: { method: "syncState" } }],
    },

    // rejects a call in a nested callback
    {
      code: `class ListController {
        syncItems() {}
        hostConnected() { [1].forEach(() => { this.syncItems(); }); }
      }`,
      errors: [{ ...SELF_SYNC, data: { method: "syncItems" } }],
    },

    // rejects a controller class expression
    {
      code: `const Tracker = class {
        hostDisconnected() { this.syncState(); }
        syncState() {}
      };`,
      errors: [{ ...SELF_SYNC, data: { method: "syncState" } }],
    },
  ],
});
