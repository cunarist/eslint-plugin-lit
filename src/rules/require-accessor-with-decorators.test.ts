import { spanOf, testRule } from "#testing";

import { requireAccessorWithDecoratorsRule } from "./require-accessor-with-decorators.ts";

const LIT =
  'import { LitElement } from "lit";\nimport { property, state } from "lit/decorators.js";\n';

/** An expected report on `name`, offering `accessor` with the given result. */
function plainField(
  name: string,
  output: string,
): {
  messageId: string;
  data: { name: string };
  suggestions: { messageId: string; data: { name: string }; output: string }[];
} {
  return {
    messageId: "plainField",
    data: { name },
    suggestions: [{ messageId: "addAccessor", data: { name }, output }],
  };
}

const propertyCode = `${LIT}class PathBar extends LitElement {\n  @property({ type: String })\n  name = '';\n}`;

testRule("require-accessor-with-decorators", requireAccessorWithDecoratorsRule, {
  valid: [
    // allows an accessor field
    `${LIT}class PathBar extends LitElement {\n  @property({ type: String })\n  accessor name = '';\n}`,
    // allows an undecorated field
    `${LIT}class PathBar extends LitElement {\n  cache = new Map();\n}`,
    // ignores static properties
    `${LIT}class PathBar extends LitElement {\n  static properties = { name: { type: String } };\n}`,
    // ignores non-components
    `${LIT}class Plain {\n  @property({ type: String })\n  name = '';\n}`,
  ],
  invalid: [
    // rejects a plain `@property` field, highlighting the field name
    {
      code: propertyCode,
      errors: [
        {
          ...plainField(
            "name",
            `${LIT}class PathBar extends LitElement {\n  @property({ type: String })\n  accessor name = '';\n}`,
          ),
          ...spanOf(propertyCode, "name"),
        },
      ],
    },
    // rejects a plain `@state` field
    {
      code: `${LIT}class PathBar extends LitElement {\n  @state()\n  #open = false;\n}`,
      errors: [
        plainField(
          "#open",
          `${LIT}class PathBar extends LitElement {\n  @state()\n  accessor #open = false;\n}`,
        ),
      ],
    },
    // reports each field
    {
      code: `${LIT}class PathBar extends LitElement {\n  @property() a = 1;\n  @state() b = 2;\n  accessor c = 3;\n}`,
      errors: [
        plainField(
          "a",
          `${LIT}class PathBar extends LitElement {\n  @property() accessor a = 1;\n  @state() b = 2;\n  accessor c = 3;\n}`,
        ),
        plainField(
          "b",
          `${LIT}class PathBar extends LitElement {\n  @property() a = 1;\n  @state() accessor b = 2;\n  accessor c = 3;\n}`,
        ),
      ],
    },
    // offers no fix where `accessor` cannot be added
    {
      code: `${LIT}class PathBar extends LitElement {\n  @property() readonly label = '';\n}`,
      errors: [{ messageId: "plainField", data: { name: "label" }, suggestions: [] }],
    },
  ],
});
