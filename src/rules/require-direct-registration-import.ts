import { relative } from "node:path";

import type { TSESTree } from "@typescript-eslint/types";

import type { LitRule, ParsedElement } from "#helpers";
import {
  docsUrl,
  isHtmlTemplate,
  lintedRealPath,
  parseTemplate,
  rangeLoc,
  runtimeImports,
  tagRegistrations,
  templateSource,
  walkElements,
} from "#helpers";

/** A file path relative to the working directory, for a readable message. */
function shortPath(cwd: string, file: string): string {
  const short = relative(cwd, file).replaceAll("\\", "/");
  return short === "" || short.startsWith("..") ? file : short;
}

/**
 * `require-direct-registration-import` — rejects a custom element used in a
 * template whose registering module this file does not import, directly or
 * through that module's own `index.ts` barrel.
 *
 * The element renders as long as some other module ran its
 * `customElements.define`, borrowing another file's import until that import
 * is removed. Which module registers a tag and which modules this file runs
 * come from the project index in `#helpers`; a tag registered nowhere it can
 * see is not reported.
 */
export const requireDirectRegistrationImportRule: LitRule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Require importing the module that registers each custom element a template uses",
      url: docsUrl("require-direct-registration-import"),
    },
    schema: [],
    messages: {
      unimported:
        "`<{{tag}}>` is used without importing `{{module}}`, the module that registers it.",
    },
  },
  create(context) {
    // Project-wide facts, computed at most once per linted file and only once
    // a template uses a custom element.
    let registrations: ReadonlyMap<string, string> | null = null;
    let imports: ReadonlySet<string> | null = null;
    let self: string | null = null;
    const isDirect = (module: string): boolean => {
      self ??= lintedRealPath(context);
      imports ??= runtimeImports(context);
      return module === self || imports.has(module);
    };
    return {
      TaggedTemplateExpression(node: TSESTree.TaggedTemplateExpression): void {
        if (!isHtmlTemplate(node, context)) {
          return;
        }
        const source = templateSource(node);
        walkElements(parseTemplate(source.text), (element: ParsedElement) => {
          const tag = element.tagName;
          if (!tag.includes("-")) {
            return;
          }
          registrations ??= tagRegistrations(context);
          const module = registrations.get(tag);
          if (module === undefined || isDirect(module)) {
            return;
          }
          const location = element.sourceCodeLocation;
          if (location === null || location === undefined) {
            return;
          }
          const span = location.startTag ?? location;
          context.report({
            loc: rangeLoc(
              context.sourceCode,
              source.toSourceRange(span.startOffset, span.endOffset),
            ),
            messageId: "unimported",
            data: { tag, module: shortPath(context.cwd, module) },
          });
        });
      },
    };
  },
};
