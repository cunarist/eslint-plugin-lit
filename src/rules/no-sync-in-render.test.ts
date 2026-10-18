import { spanOf, testRule } from "#testing";

import { noSyncInRenderRule } from "./no-sync-in-render.ts";

const LIT = 'import { html, LitElement } from "lit";\n';

const SYNC_IN_RENDER = { messageId: "syncInRender" };

const highlightCode = `${LIT}class ListElement extends LitElement {
  #list = new ListController(this);
  render() { this.#list.syncItems(); return html\`\`; }
}`;

testRule("no-sync-in-render", noSyncInRenderRule, {
  valid: [
    // allows syncing from a property setter
    `${LIT}class ListElement extends LitElement {
      #list = new ListController(this);
      set items(value: string[]) { this.#list.syncItems(value); }
      render() { return html\`\`; }
    }`,

    // allows other controller calls in render
    `${LIT}class ListElement extends LitElement {
      #list = new ListController(this);
      render() { return html\`\${this.#list.format()}\`; }
    }`,

    // ignores fields that do not hold a controller
    `${LIT}class ListElement extends LitElement {
      #signal = new AbortController();
      #store = new Store();
      render() { this.#store.syncItems(); return html\`\`; }
    }`,

    // ignores non-Lit classes
    `class Plain {
      #list = new ListController(this);
      render() { this.#list.syncItems(); }
    }`,

    // ignores a class expression nested in render
    `${LIT}class ListElement extends LitElement {
      #list = new ListController(this);
      render() {
        const Inner = class { #list = new ListController(this); run() { this.#list.syncItems(); } };
        return html\`\${Inner.name}\`;
      }
    }`,

    // ignores sync calls on a field's field
    `${LIT}class ListElement extends LitElement {
      #list = new ListController(this);
      render() { this.#list.child.syncItems(); return html\`\`; }
    }`,
  ],
  invalid: [
    // rejects syncing a `new *Controller()` field, highlighting the call
    {
      code: highlightCode,
      errors: [
        {
          ...SYNC_IN_RENDER,
          data: { method: "syncItems" },
          ...spanOf(highlightCode, "this.#list.syncItems()"),
        },
      ],
    },

    // rejects a field named `*controller`
    {
      code: `${LIT}class ListElement extends LitElement {
      declare listController: ListController;
      render() { this.listController.sync(); return html\`\`; }
    }`,
      errors: [{ ...SYNC_IN_RENDER, data: { method: "sync" } }],
    },

    // rejects a controller assigned in the constructor
    {
      code: `${LIT}class ListElement extends LitElement {
      list: ListController;
      constructor() { super(); this.list = new ListController(this); }
      render() { this.list.syncItems(); return html\`\`; }
    }`,
      errors: [{ ...SYNC_IN_RENDER, data: { method: "syncItems" } }],
    },

    // rejects a sync in a nested callback
    {
      code: `${LIT}class ListElement extends LitElement {
      #list = new ListController(this);
      render() {
        [1].forEach(() => { this.#list.syncItems(); });
        return html\`\`;
      }
    }`,
      errors: [{ ...SYNC_IN_RENDER, data: { method: "syncItems" } }],
    },

    // rejects a component extending a local Lit component
    {
      code: `${LIT}class BaseElement extends LitElement {}
      class ListElement extends BaseElement {
        #list = new lists.ListController(this);
        render() { this.#list.syncItems(); return html\`\`; }
      }`,
      errors: [{ ...SYNC_IN_RENDER, data: { method: "syncItems" } }],
    },

    // rejects a component extending an aliased LitElement import
    {
      code: `import { LitElement as Base } from "lit";
      class ListElement extends Base {
        #list = new ListController(this);
        render() { this.#list.syncItems(); return null; }
      }`,
      errors: [{ ...SYNC_IN_RENDER, data: { method: "syncItems" } }],
    },
  ],
});
