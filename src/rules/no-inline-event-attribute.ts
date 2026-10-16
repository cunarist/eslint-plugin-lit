import type { TSESTree } from "@typescript-eslint/types";

import type { LitRule, ParsedElement } from "#helpers";
import {
  docsUrl,
  isHtmlTemplate,
  parseTemplate,
  rangeLoc,
  templateSource,
  walkElements,
} from "#helpers";

/**
 * HTML event handler content attributes. Matched against an explicit list
 * rather than an `on*` prefix, because attributes like `once` and `only` share
 * that prefix without being handlers.
 */
const HANDLER_ATTRIBUTES: ReadonlySet<string> = new Set([
  "onabort",
  "onanimationend",
  "onanimationiteration",
  "onanimationstart",
  "onauxclick",
  "onbeforeinput",
  "onbeforetoggle",
  "onbeforeunload",
  "onblur",
  "oncancel",
  "oncanplay",
  "oncanplaythrough",
  "onchange",
  "onclick",
  "onclose",
  "oncontextmenu",
  "oncopy",
  "oncuechange",
  "oncut",
  "ondblclick",
  "ondrag",
  "ondragend",
  "ondragenter",
  "ondragleave",
  "ondragover",
  "ondragstart",
  "ondrop",
  "ondurationchange",
  "onemptied",
  "onended",
  "onerror",
  "onfocus",
  "onfocusin",
  "onfocusout",
  "onformdata",
  "oninput",
  "oninvalid",
  "onkeydown",
  "onkeypress",
  "onkeyup",
  "onload",
  "onloadeddata",
  "onloadedmetadata",
  "onloadstart",
  "onmousedown",
  "onmouseenter",
  "onmouseleave",
  "onmousemove",
  "onmouseout",
  "onmouseover",
  "onmouseup",
  "onpaste",
  "onpause",
  "onplay",
  "onplaying",
  "onpointercancel",
  "onpointerdown",
  "onpointerenter",
  "onpointerleave",
  "onpointermove",
  "onpointerout",
  "onpointerover",
  "onpointerup",
  "onprogress",
  "onratechange",
  "onreset",
  "onresize",
  "onscroll",
  "onscrollend",
  "onsecuritypolicyviolation",
  "onseeked",
  "onseeking",
  "onselect",
  "onselectionchange",
  "onselectstart",
  "onslotchange",
  "onstalled",
  "onsubmit",
  "onsuspend",
  "ontimeupdate",
  "ontoggle",
  "ontransitionend",
  "onvolumechange",
  "onwaiting",
  "onwheel",
]);

/** A value that is one binding and nothing else, e.g. `${this.go}`. */
const SINGLE_BINDING: RegExp = /^\{\{__lit_\d+__\}\}$/u;

/**
 * `no-inline-event-attribute` — rejects HTML inline event handler attributes
 * such as `onclick` inside an `html` template.
 *
 * An `onclick="…"` attribute is evaluated as global-scope JavaScript, so the
 * handler cannot see the component instance, and every strict
 * Content-Security-Policy blocks it. Written as `onclick=${this.go}` it is
 * worse: Lit sets the attribute to the stringified function. Lit's
 * `@click=${…}` binding attaches a real listener with the right `this`.
 */
export const noInlineEventAttributeRule: LitRule = {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow inline event handler attributes in templates",
      url: docsUrl("no-inline-event-attribute"),
    },
    hasSuggestions: true,
    schema: [],
    messages: {
      inline: "Unexpected inline `{{name}}` attribute; use Lit's `@{{event}}=${…}` event binding.",
      useBinding: "Bind it as `@{{event}}`.",
    },
  },
  create(context) {
    return {
      TaggedTemplateExpression(node: TSESTree.TaggedTemplateExpression): void {
        if (!isHtmlTemplate(node, context)) {
          return;
        }
        const source = templateSource(node);
        walkElements(parseTemplate(source.text), (element: ParsedElement) => {
          const locations = element.sourceCodeLocation?.attrs;
          if (locations === undefined) {
            return;
          }
          for (const attribute of element.attrs) {
            const name = attribute.name.toLowerCase();
            const location = HANDLER_ATTRIBUTES.has(name) ? locations[name] : undefined;
            if (location === undefined) {
              continue;
            }
            const event = name.slice("on".length);
            const nameRange = source.toSourceRange(
              location.startOffset,
              location.startOffset + name.length,
            );
            // Only a bound handler can become a binding as it is; a string of
            // code would need rewriting into a function.
            const binding = `@${event}`;
            context.report({
              loc: rangeLoc(
                context.sourceCode,
                source.toSourceRange(location.startOffset, location.endOffset),
              ),
              messageId: "inline",
              data: { name, event },
              suggest: SINGLE_BINDING.test(attribute.value)
                ? [
                    {
                      messageId: "useBinding",
                      data: { event },
                      fix: (fixer) => fixer.replaceTextRange(nameRange, binding),
                    },
                  ]
                : [],
            });
          }
        });
      },
    };
  },
};
