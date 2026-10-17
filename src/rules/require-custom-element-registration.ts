import type { TSESTree } from "@typescript-eslint/types";

import {
  type ClassNode,
  classDecorators,
  docsUrl,
  isLitComponent,
  type LitRule,
  type LitRuleContext,
  memberPath,
} from "#helpers";

/** A candidate component awaiting proof that it is registered. */
interface Candidate {
  name: string;
  node: TSESTree.Identifier;
}

/** Last segment of a dotted path, e.g. `elements.One` -> `One`. */
function lastSegment(path: string): string {
  return path.split(".").pop() ?? path;
}

/** Whether a class carries `@customElement(…)`. */
function hasCustomElementDecorator(node: ClassNode): boolean {
  return classDecorators(node).some((decorator) => {
    const expression = decorator.expression;
    const source =
      expression.type === "CallExpression" ? memberPath(expression.callee) : memberPath(expression);
    return source === "customElement";
  });
}

/** Whether a call is `customElements.define(…)`, however it is qualified. */
function isDefineCall(node: TSESTree.CallExpression): boolean {
  const path = memberPath(node.callee);
  return (
    path !== null && (path === "customElements.define" || path.endsWith(".customElements.define"))
  );
}

/** The name of a class declaration a file must register, or `null`. */
function candidateOf(context: LitRuleContext, node: TSESTree.ClassDeclaration): Candidate | null {
  if (
    !isLitComponent(node, context) ||
    node.abstract ||
    hasCustomElementDecorator(node) ||
    node.id === null
  ) {
    return null;
  }
  return { name: node.id.name, node: node.id };
}

/** The class name a `customElements.define(…)` call registers, or `null`. */
function definedName(node: TSESTree.CallExpression): string | null {
  if (!isDefineCall(node)) {
    return null;
  }
  const target = node.arguments[1];
  const path = target === undefined ? null : memberPath(target);
  return path === null ? null : lastSegment(path);
}

/**
 * `require-custom-element-registration` — a `LitElement` subclass that is
 * never registered has no tag, so it can never appear in a template, and the
 * failure shows up as an empty area on screen with nothing in the console.
 *
 * Abstract classes are exempt, and so is a class that this file both exports
 * and extends: that is a base, not a component.
 */
export const requireCustomElementRegistrationRule: LitRule = {
  meta: {
    type: "problem",
    docs: {
      description: "Require every Lit component in a file to be registered as a custom element",
      url: docsUrl("require-custom-element-registration"),
    },
    schema: [],
    messages: {
      unregistered: "'{{name}}' is never registered as a custom element.",
    },
  },
  create(context) {
    const candidates: Candidate[] = [];
    /** Names appearing as `extends X` anywhere in this file. */
    const extendedNames = new Set<string>();
    /** Names of classes exported from this file. */
    const exportedNames = new Set<string>();
    /** Names passed to `customElements.define`. */
    const definedNames = new Set<string>();

    function noteSuperClass(node: ClassNode): void {
      const path = node.superClass === null ? null : memberPath(node.superClass);
      if (path !== null) {
        extendedNames.add(lastSegment(path));
      }
    }

    return {
      ExportNamedDeclaration(node: TSESTree.ExportNamedDeclaration): void {
        const declaration = node.declaration;
        if (declaration?.type === "ClassDeclaration" && declaration.id !== null) {
          exportedNames.add(declaration.id.name);
        }
      },
      ClassExpression(node: TSESTree.ClassExpression): void {
        noteSuperClass(node);
      },
      ClassDeclaration(node: TSESTree.ClassDeclaration): void {
        noteSuperClass(node);
        const candidate = candidateOf(context, node);
        if (candidate !== null) {
          candidates.push(candidate);
        }
      },
      CallExpression(node: TSESTree.CallExpression): void {
        const name = definedName(node);
        if (name !== null) {
          definedNames.add(name);
        }
      },
      "Program:exit"(): void {
        for (const { name, node } of candidates) {
          // Exported and extended in this file: a base class, not a component.
          const isBase = exportedNames.has(name) && extendedNames.has(name);
          if (!definedNames.has(name) && !isBase) {
            context.report({ node, messageId: "unregistered", data: { name } });
          }
        }
      },
    };
  },
};
