/**
 * Lit-specific detection helpers, over the file being linted.
 *
 * A name in the linted file is looked up through the host's scope analysis,
 * so a parameter or local function that happens to be called `html` is not
 * mistaken for Lit's. A name bound by an import is then followed into other
 * files by `modules.ts` until it reaches its declaration, which `identity.ts`
 * checks. Anything that cannot be followed answers "not Lit", never a guess.
 */

import type { TSESTree } from "@typescript-eslint/types";
import { resolve } from "node:path";

import type { ClassNode } from "./ast.ts";
import { classDecorators, memberPath } from "./ast.ts";
import type { Binding } from "./bindings.ts";
import { resolveExport, resolveImport } from "./bindings.ts";
import type { LitTemplateKind, Seen } from "./identity.ts";
import { extendsLitBase, isCustomElementDecorator, templateKindOf } from "./identity.ts";
import { moduleFromText, realPath } from "./modules.ts";
import { registrationIndex } from "./registration.ts";
import type { LitRuleContext, ScopeDefinition, ScopeVariable } from "./rule.ts";
import { runtimeImportedFiles } from "./runtime-imports.ts";
import { importedName } from "./specifiers.ts";

export type { LitTemplateKind } from "./identity.ts";

/** Lifecycle members Lit defines on `ReactiveElement`/`LitElement`. */
export const LIT_LIFECYCLE_MEMBERS: readonly string[] = [
  "connectedCallback",
  "disconnectedCallback",
  "attributeChangedCallback",
  "adoptedCallback",
  "createRenderRoot",
  "firstUpdated",
  "updated",
  "shouldUpdate",
  "update",
  "willUpdate",
  "performUpdate",
  "requestUpdate",
  "scheduleUpdate",
  "render",
];

/** Decorators that declare a reactive property. */
export const REACTIVE_PROPERTY_DECORATORS: readonly string[] = ["property", "state"];

/** The absolute path of the file being linted. */
export function lintedPath(context: LitRuleContext): string {
  return resolve(context.cwd, context.physicalFilename);
}

/** The real path of the file being linted, as the cross-file lookups key it. */
export function lintedRealPath(context: LitRuleContext): string {
  return realPath(lintedPath(context));
}

/**
 * Where each custom element tag is registered, across the project the linted
 * file belongs to, as real paths. See `registration.ts`.
 */
export function tagRegistrations(context: LitRuleContext): ReadonlyMap<string, string> {
  return registrationIndex(lintedPath(context));
}

/**
 * The real paths of the files the linted file runs: its own runtime imports
 * and re-exports, plus what an imported barrel runs from its own folder.
 * Read from the host's text of the file, saved or not.
 */
export function runtimeImports(context: LitRuleContext): ReadonlySet<string> {
  const module = moduleFromText(lintedPath(context), context.sourceCode.text);
  return module === null ? new Set() : runtimeImportedFiles(module);
}

/** The variable an identifier refers to, through every enclosing scope. */
export function variableOf(
  context: LitRuleContext,
  identifier: TSESTree.Identifier,
): ScopeVariable | null {
  let scope: ReturnType<typeof context.sourceCode.getScope> | null =
    context.sourceCode.getScope(identifier);
  while (scope !== null) {
    const variable = scope.set.get(identifier.name);
    if (variable !== undefined) {
      return variable;
    }
    scope = scope.upper;
  }
  return null;
}

/** Where an import definition points, followed across files. */
function importBinding(context: LitRuleContext, definition: ScopeDefinition): Binding | null {
  const declaration = definition.parent;
  const imported = importedName(definition.node);
  if (declaration?.type !== "ImportDeclaration" || imported === null) {
    return null;
  }
  return resolveImport(lintedPath(context), declaration.source.value, imported);
}

/** The definition a name was declared by, when it was declared once. */
function onlyDefinition(variable: ScopeVariable | null): ScopeDefinition | null {
  if (variable?.defs.length !== 1) {
    return null;
  }
  return variable.defs[0] ?? null;
}

/**
 * What an imported name or `ns.name` refers to in another file, or `null`
 * when the expression is not bound by an import.
 */
function importedReference(context: LitRuleContext, node: TSESTree.Node): Binding | null {
  if (node.type === "Identifier") {
    const definition = onlyDefinition(variableOf(context, node));
    return definition?.type === "ImportBinding" ? importBinding(context, definition) : null;
  }
  if (
    node.type === "MemberExpression" &&
    !node.computed &&
    node.object.type === "Identifier" &&
    node.property.type === "Identifier"
  ) {
    const namespace = importedReference(context, node.object);
    return namespace?.kind === "namespace"
      ? resolveExport(namespace.module, node.property.name)
      : null;
  }
  return null;
}

/**
 * Whether an expression in the linted file is, or extends, a Lit base class:
 * an import, a class or `const` declared in this file, a class expression, or
 * a mixin call `Mixin(Base)`, whose arguments are followed.
 */
function extendsLit(context: LitRuleContext, node: TSESTree.Node, seen: Seen): boolean {
  if (seen.has(node)) {
    return false;
  }
  seen.add(node);
  switch (node.type) {
    case "Identifier": {
      const definition = onlyDefinition(variableOf(context, node));
      if (definition === null) {
        return false;
      }
      switch (definition.type) {
        case "ImportBinding":
          return extendsLitBase(importBinding(context, definition), seen);
        case "ClassName":
          return extendsLit(context, definition.node, seen);
        case "Variable":
          return (
            definition.node.type === "VariableDeclarator" &&
            definition.node.init !== null &&
            extendsLit(context, definition.node.init, seen)
          );
        default:
          return false;
      }
    }
    case "MemberExpression":
      return extendsLitBase(importedReference(context, node), seen);
    case "ClassDeclaration":
    case "ClassExpression":
      return node.superClass !== null && extendsLit(context, node.superClass, seen);
    case "CallExpression":
      return node.arguments.some((argument) => extendsLit(context, argument, seen));
    case "TSAsExpression":
    case "TSSatisfiesExpression":
    case "TSNonNullExpression":
      return extendsLit(context, node.expression, seen);
    default:
      return false;
  }
}

/**
 * Whether a class is a Lit component: whether its heritage chain reaches
 * `LitElement` or `ReactiveElement`.
 *
 * The chain is followed across files and into packages, so a component whose
 * base lives in another module is recognized. When the chain cannot be
 * followed this reports `false` rather than guess.
 */
export function isLitComponent(node: ClassNode, context: LitRuleContext): boolean {
  return node.superClass !== null && extendsLit(context, node.superClass, new Set());
}

/**
 * Whether a tagged template uses the given Lit tag (`html`, `svg`, or `css`).
 *
 * The tag is followed to the declaration it denotes and that declaration's
 * file checked, so a local function named `html` is not mistaken for Lit's.
 */
export function isTaggedWith(
  node: TSESTree.TaggedTemplateExpression,
  tag: LitTemplateKind,
  context: LitRuleContext,
): boolean {
  return templateKindOf(importedReference(context, node.tag)) === tag;
}

/** Whether a tagged template is an `html` template. */
export function isHtmlTemplate(
  node: TSESTree.TaggedTemplateExpression,
  context: LitRuleContext,
): boolean {
  return isTaggedWith(node, "html", context) || isTaggedWith(node, "svg", context);
}

/** Whether a tagged template is a `css` template. */
export function isCssTemplate(
  node: TSESTree.TaggedTemplateExpression,
  context: LitRuleContext,
): boolean {
  return isTaggedWith(node, "css", context);
}

/** Whether an expression in the linted file is Lit's `customElement` decorator. */
export function isLitCustomElement(context: LitRuleContext, node: TSESTree.Node): boolean {
  return isCustomElementDecorator(importedReference(context, node));
}

/** The custom element tag registered by `@customElement("x-y")`, if any. */
export function customElementTag(node: ClassNode): string | null {
  for (const decorator of classDecorators(node)) {
    const expression = decorator.expression;
    if (expression.type !== "CallExpression" || memberPath(expression.callee) !== "customElement") {
      continue;
    }
    const first = expression.arguments[0];
    if (first?.type === "Literal" && typeof first.value === "string") {
      return first.value;
    }
  }
  return null;
}

/** Whether a property definition declares a reactive property. */
export function isReactiveProperty(
  node: TSESTree.PropertyDefinition | TSESTree.AccessorProperty,
): boolean {
  return node.decorators.some((decorator) => {
    const expression = decorator.expression;
    const source =
      expression.type === "CallExpression" ? memberPath(expression.callee) : memberPath(expression);
    return source !== null && REACTIVE_PROPERTY_DECORATORS.includes(source);
  });
}
