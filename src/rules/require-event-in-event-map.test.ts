import { spanOf, testRule } from "#testing";

import { requireEventInEventMapRule } from "./require-event-in-event-map.ts";

const IMPORT = 'import { LitElement } from "lit";';

const MAP = [
  "declare global {",
  "  interface HTMLElementEventMap {",
  '    "cl-picked": CustomEvent<string>;',
  "  }",
  "}",
].join("\n");

/** A component whose `fire()` runs `statements`, after the import. */
function component(...statements: string[]): string {
  return [
    "class PathBar extends LitElement {",
    "  fire() {",
    ...statements.map((statement) => `    ${statement}`),
    "  }",
    "}",
  ].join("\n");
}

/** The augmentation the suggestion appends for `name`. */
function entry(name: string, type: string): string {
  return [
    "",
    "declare global {",
    "  interface HTMLElementEventMap {",
    `    "${name}": ${type};`,
    "  }",
    "}",
    "",
  ].join("\n");
}

/** The expected report for `name`, whose suggestion appends to `code`. */
function missing(
  code: string,
  name: string,
  type: string,
): {
  messageId: string;
  data: { name: string };
  suggestions: { messageId: string; output: string }[];
} {
  return {
    messageId: "missingEntry",
    data: { name },
    suggestions: [{ messageId: "addEntry", output: `${code}\n${entry(name, type)}` }],
  };
}

const droppedCode = [IMPORT, component('this.dispatchEvent(new CustomEvent("cl-dropped"));')].join(
  "\n",
);

const pairCode = [
  IMPORT,
  component(
    'this.dispatchEvent(new CustomEvent("cl-a"));',
    'this.dispatchEvent(new CustomEvent("cl-b"));',
  ),
].join("\n");

const declaredDroppedCode = [
  IMPORT,
  MAP,
  component('this.dispatchEvent(new CustomEvent("cl-dropped"));'),
].join("\n");

const resetCode = [IMPORT, component('this.dispatchEvent(new Event("cl-reset"));')].join("\n");

testRule("require-event-in-event-map", requireEventInEventMapRule, {
  valid: [
    // allows a declared event
    [
      IMPORT,
      MAP,
      component('this.dispatchEvent(new CustomEvent("cl-picked", { detail: 1 }));'),
    ].join("\n"),

    // accepts the entry declared after
    [IMPORT, component('this.dispatchEvent(new CustomEvent("cl-picked"));'), MAP].join("\n"),

    // ignores non-components
    [
      "class Plain {",
      "  fire() {",
      '    this.dispatchEvent(new CustomEvent("cl-picked"));',
      "  }",
      "}",
    ].join("\n"),

    // ignores a computed event name
    [IMPORT, component("this.dispatchEvent(new CustomEvent(this.eventName));")].join("\n"),
  ],
  invalid: [
    // rejects an undeclared event
    {
      code: declaredDroppedCode,
      errors: [missing(declaredDroppedCode, "cl-dropped", "CustomEvent")],
    },

    // rejects a plain Event too
    { code: resetCode, errors: [missing(resetCode, "cl-reset", "Event")] },

    // reports each undeclared name, in order
    {
      code: pairCode,
      errors: [missing(pairCode, "cl-a", "CustomEvent"), missing(pairCode, "cl-b", "CustomEvent")],
    },

    // highlights the event name
    {
      code: droppedCode,
      errors: [
        {
          ...missing(droppedCode, "cl-dropped", "CustomEvent"),
          ...spanOf(droppedCode, '"cl-dropped"'),
        },
      ],
    },
  ],
});
