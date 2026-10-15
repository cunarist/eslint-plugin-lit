import { spanOf, testRule } from "#testing";

import { requireTagNameMapRule } from "./require-tag-name-map.ts";

const IMPORT = 'import { LitElement } from "lit";\n';

/** The augmentation the suggestion appends, after code that ends a line. */
function entry(tag: string, className: string): string {
  return `\n\ndeclare global {\n  interface HTMLElementTagNameMap {\n    "${tag}": ${className};\n  }\n}\n`;
}

/** The expected report for an unmapped `tag`, whose suggestion appends to `code`. */
function missing(
  code: string,
  tag: string,
  className: string,
): {
  messageId: string;
  data: { tag: string };
  suggestions: { messageId: string; output: string }[];
} {
  return {
    messageId: "missingEntry",
    data: { tag },
    suggestions: [{ messageId: "addEntry", output: `${code}${entry(tag, className)}` }],
  };
}

const missingCode = `${IMPORT}@customElement("cl-path-bar")
     export class PathBar extends LitElement {}`;

const otherTagCode = `${IMPORT}declare global {
       interface HTMLElementTagNameMap { "cl-side-bar": PathBar; }
     }
     @customElement("cl-path-bar")
     export class PathBar extends LitElement {}`;

const otherClassCode = `${IMPORT}declare global {
       interface HTMLElementTagNameMap { "cl-path-bar": SideBar; }
     }
     @customElement("cl-path-bar")
     export class PathBar extends LitElement {}`;

const pairCode = `${IMPORT}@customElement("cl-a") export class A extends LitElement {}
     @customElement("cl-b") export class B extends LitElement {}`;

const highlightCode = `${IMPORT}@customElement("cl-path-bar")\nexport class PathBar extends LitElement {}`;

testRule("require-tag-name-map", requireTagNameMapRule, {
  valid: [
    // allows a registered class with its entry
    `${IMPORT}declare global {
       interface HTMLElementTagNameMap {
         "cl-path-bar": PathBar;
       }
     }
     @customElement("cl-path-bar")
     export class PathBar extends LitElement {}`,

    // allows the entry declared after the class
    `${IMPORT}@customElement("cl-path-bar")
     export class PathBar extends LitElement {}
     declare global {
       interface HTMLElementTagNameMap { "cl-path-bar": PathBar; }
     }`,

    // ignores unregistered classes
    `${IMPORT}export class PathBar extends LitElement {}`,
  ],
  invalid: [
    // rejects a missing augmentation
    { code: missingCode, errors: [missing(missingCode, "cl-path-bar", "PathBar")] },

    // rejects an entry for a different tag
    { code: otherTagCode, errors: [missing(otherTagCode, "cl-path-bar", "PathBar")] },

    // rejects an entry mapped to another class
    {
      code: otherClassCode,
      errors: [
        {
          messageId: "wrongClass",
          data: { tag: "cl-path-bar", mapped: "SideBar", className: "PathBar" },
          suggestions: [
            {
              messageId: "mapToClass",
              data: { className: "PathBar" },
              output: otherClassCode.replace("SideBar", "PathBar"),
            },
          ],
        },
      ],
    },

    // reports each unmapped component
    {
      code: pairCode,
      errors: [missing(pairCode, "cl-a", "A"), missing(pairCode, "cl-b", "B")],
    },

    // highlights the registered tag
    {
      code: highlightCode,
      errors: [
        {
          ...missing(highlightCode, "cl-path-bar", "PathBar"),
          ...spanOf(highlightCode, '"cl-path-bar"'),
        },
      ],
    },
  ],
});
