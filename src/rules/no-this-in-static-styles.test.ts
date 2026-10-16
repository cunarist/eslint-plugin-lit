import { spanOf, testRule } from "#testing";

import { noThisInStaticStylesRule } from "./no-this-in-static-styles.ts";

/** Appended rather than prepended, so the snippet's own offsets stay put. */
const IMPORTS = '\nimport { LitElement, css, html } from "lit";';

const highlightCode = `class El extends LitElement {
  static styles = css\`\${this.color}\`;
}${IMPORTS}`;

const STATIC_THIS = { messageId: "staticThis" };

testRule("no-this-in-static-styles", noThisInStaticStylesRule, {
  valid: [
    // allows a plain static styles
    `class El extends LitElement {
  static styles = css\`:host { color: red; }\`;
}${IMPORTS}`,

    // allows this in instance members
    `class El extends LitElement {
  styles = this.color;
  render() { return html\`\${this.color}\`; }
}${IMPORTS}`,

    // ignores other static fields
    `class El extends LitElement {
  static properties = { color: {} };
  render() { return html\`\`; }
}${IMPORTS}`,

    // Accessor initializers, minimized from memona files that crashed once the
    // walk passed the root: `Program.parent` is null at runtime, not undefined.
    // document-save-provider.ts: initialized from a private field
    `class DocumentSaveProvider extends LitElement {
  #native = { closeContext: {} };
  accessor nativeClose = this.#native.closeContext;
}${IMPORTS}`,

    // dialog-provider.ts: a private accessor initialized by a private method
    `class DialogProvider extends LitElement {
  accessor #context = this.#createContext();
  #createContext() { return {}; }
}${IMPORTS}`,

    // folder-agent-settings-dialog.ts: an arrow in an accessor's object value
    `class FolderAgentSettingsDialog extends LitElement {
  saving = false;
  accessor dialogCloseController = {
    requestClose: () => {
      if (!this.saving) this.onClose();
    },
  };
  onClose() {}
}${IMPORTS}`,

    // ignores non-Lit classes, where this is the class object, not a host
    `class Plain {
  static styles = this.color;
}${IMPORTS}`,
  ],
  invalid: [
    // rejects this in the initializer
    {
      code: `class El extends LitElement {
  static styles = css\`:host { color: \${this.color}; }\`;
}${IMPORTS}`,
      errors: [STATIC_THIS],
    },

    // rejects this inside an arrow
    {
      code: `class El extends LitElement {
  static styles = [1].map(() => this.color);
}${IMPORTS}`,
      errors: [STATIC_THIS],
    },

    // highlights the this expression
    { code: highlightCode, errors: [{ ...STATIC_THIS, ...spanOf(highlightCode, "this") }] },
  ],
});
