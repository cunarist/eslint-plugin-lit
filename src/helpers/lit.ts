/**
 * Lit-specific detection helpers, over the file being linted.
 *
 * A name in the linted file is looked up through the host's scope analysis,
 * so a parameter or local function that happens to be called `html` is not
 * mistaken for Lit's. A name bound by an import is then followed into other
 * files by `modules.ts` until it reaches its declaration, which `identity.ts`
 * checks. Anything that cannot be followed answers "not Lit", never a guess.
 */

import { resolve } from "node:path";

import type { TSESTree } from "@typescript-eslint/types";

import type { ClassNode } from "./ast.ts";
import { classDecorators, findConstructor, memberPath, typeReferenceName } from "./ast.ts";
import type { LitTemplateKind, Seen } from "./identity.ts";
import { extendsLitBase, isCustomElementDecorator, templateKindOf } from "./identity.ts";
import type { Binding } from "./modules.ts";
import { moduleFromText, realPath, resolveExport, resolveImport } from "./modules.ts";
import { registrationIndex, runtimeImportedFiles } from "./registration.ts";
import type { LitRuleContext, ScopeDefinition, ScopeVariable } from "./rule.ts";

export type { LitTemplateKind } from "./identity.ts";

/** Module specifiers that count as "the Lit core" for import checks. */
export const LIT_CORE_SOURCES: readonly string[] = ["lit", "lit-html", "lit-element"];

/** Legacy v1 specifiers that should be replaced by `lit`. */
export const LEGACY_LIT_SOURCES: readonly string[] = ["lit-html", "lit-element"];

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

/** The name an import specifier imports: `default`, `*`, or the export name. */
function importedName(node: TSESTree.Node): string | null {
  switch (node.type) {
    case "ImportSpecifier":
      return node.imported.type === "Identifier" ? node.imported.name : node.imported.value;
    case "ImportDefaultSpecifier":
      return "default";
    case "ImportNamespaceSpecifier":
      return "*";
    default:
      return null;
  }
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

/** Whether a class declares `implements ReactiveController`. */
export function hasReactiveControllerInterface(node: ClassNode): boolean {
  return (node.implements ?? []).some(
    (clause) => memberPath(clause.expression) === "ReactiveController",
  );
}

/**
 * Whether a class is a reactive controller.
 *
 * The only signal is the `implements ReactiveController` clause. Earlier this
 * also accepted a class name ending in `Controller`, which reported plain
 * classes called `GameController` and stayed silent on a controller called
 * anything else. A declaration the author wrote is a fact; a name is a guess.
 *
 * The cost is that a controller which omits the clause is never checked. That
 * is the honest trade: these rules apply to classes that declare themselves.
 */
export function isReactiveController(node: ClassNode): boolean {
  return hasReactiveControllerInterface(node);
}

/** The `ReactiveControllerHost` parameter in a constructor, by type not name. */
function hostParamOf(constructor: TSESTree.MethodDefinition): TSESTree.Identifier | null {
  for (const param of constructor.value.params) {
    if (
      param.type === "Identifier" &&
      typeReferenceName(param.typeAnnotation ?? null) === "ReactiveControllerHost"
    ) {
      return param;
    }
  }
  return null;
}

/**
 * The constructor parameter a controller receives its host through.
 *
 * Found by its `ReactiveControllerHost` type, not by the name `host`, so this
 * does not depend on `host-constructor` having enforced that name: a controller
 * may call the parameter anything.
 */
export function controllerHostParam(node: ClassNode): TSESTree.Identifier | null {
  const constructor = findConstructor(node);
  return constructor === null ? null : hostParamOf(constructor);
}

/**
 * The field a controller stores its host in, by name (`#host`, `host`, `_host`,
 * …), or null.
 *
 * The host parameter is found by type, then followed to a top-level
 * `this.<field> = host` assignment in the constructor. Anything more elaborate,
 * an intermediate alias (`const h = host; this.#host = h`), destructuring, or a
 * nested target (`this.state.host`), is unanalyzable and returns null; callers
 * skip the controller rather than guess. Returns null too when the host is not
 * stored at all, which is legitimate: a controller that only registers itself
 * needs no field.
 */
export function controllerHostField(node: ClassNode): string | null {
  const constructor = findConstructor(node);
  if (constructor === null) {
    return null;
  }
  const param = hostParamOf(constructor);
  const body = constructor.value.body;
  if (param === null || body === null) {
    return null;
  }
  for (const statement of body.body) {
    if (statement.type !== "ExpressionStatement") {
      continue;
    }
    const expression = statement.expression;
    if (
      expression.type !== "AssignmentExpression" ||
      expression.operator !== "=" ||
      expression.right.type !== "Identifier" ||
      expression.right.name !== param.name
    ) {
      continue;
    }
    const target = expression.left;
    if (
      target.type !== "MemberExpression" ||
      target.computed ||
      target.object.type !== "ThisExpression"
    ) {
      continue;
    }
    const property = target.property;
    if (property.type === "Identifier") {
      return property.name;
    }
    if (property.type === "PrivateIdentifier") {
      return `#${property.name}`;
    }
  }
  return null;
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

/**
 * The local name bound to a named import, when the module specifier matches.
 *
 * Rules that key on a bare call, `repeat(...)` or `createContext(...)`, must
 * confirm the name came from the module they mean. Without it the rule fires on
 * any unrelated function that happens to share the name.
 */
export function importedLocalName(
  node: TSESTree.ImportDeclaration,
  matchesSource: (source: string) => boolean,
  imported: string,
): string | null {
  if (!matchesSource(node.source.value)) {
    return null;
  }
  for (const specifier of node.specifiers) {
    // `import * as ns from "…"` binds every export under `ns.`.
    if (specifier.type === "ImportNamespaceSpecifier") {
      return `${specifier.local.name}.${imported}`;
    }
    if (specifier.type === "ImportSpecifier" && importedName(specifier) === imported) {
      return specifier.local.name;
    }
  }
  return null;
}

/** Matches Lit's `repeat` directive module in any of the three packages. */
const REPEAT_MODULE: RegExp = /^(?:lit|lit-html|lit-element)\/directives\/repeat\.js$/u;

/** Whether a specifier is Lit's `repeat` directive module. */
export function isRepeatModule(source: string): boolean {
  return REPEAT_MODULE.test(source);
}

/** Whether a specifier is the `@lit/context` package. */
export function isContextModule(source: string): boolean {
  return source === "@lit/context";
}
