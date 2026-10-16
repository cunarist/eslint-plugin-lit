/**
 * Which declarations are Lit's, decided from the file they live in.
 *
 * The Deno plugin asked the TypeScript checker which file declared a symbol;
 * here the same question is answered by following imports to the declaration
 * with `modules.ts`. The identities are the same: `LitElement` and
 * `ReactiveElement` declared in `lit-element` or `@lit/reactive-element`,
 * `html`/`svg` in `lit-html`, `css` in reactive-element's `css-tag`, and the
 * `customElement` decorator in reactive-element's `custom-element`. A
 * same-named declaration anywhere else is not Lit's.
 */

import type { Expression, TSType } from "oxc-parser";

import type { Binding } from "./bindings.ts";
import { declarationName, resolveExport, resolveLocal } from "./bindings.ts";
import type { ModuleFile } from "./modules.ts";

/** A tagged-template kind provided by Lit. */
export type LitTemplateKind = "html" | "svg" | "css";

/** The classes every Lit component ultimately extends. */
const LIT_BASE_NAMES: ReadonlySet<string> = new Set(["LitElement", "ReactiveElement"]);

/**
 * The packages that declare the base classes. `lit` re-exports them, so the
 * declaration an import resolves to lives in one of these two.
 */
const LIT_BASE_PACKAGES: RegExp = /\/(?:lit-element|@lit\/reactive-element)\//u;

/** The declaration files of Lit's `html` tag: the plain one and the static one. */
const HTML_DECLARATION: RegExp = /\/lit-html\/(?:.*\/)?(?:lit-html|static)\.d\.[cm]?ts$/u;

/** The declaration file of Lit's `svg` tag. */
const SVG_DECLARATION: RegExp = /\/lit-html\/(?:.*\/)?lit-html\.d\.[cm]?ts$/u;

/** The declaration file of Lit's `css` tag. */
const CSS_DECLARATION: RegExp = /\/@lit\/reactive-element\/(?:.*\/)?css-tag\.d\.[cm]?ts$/u;

/** The declaration file of Lit's `customElement` decorator. */
const CUSTOM_ELEMENT_DECLARATION: RegExp =
  /\/@lit\/reactive-element\/(?:.*\/)?custom-element\.d\.[cm]?ts$/u;

/** The declaration file pattern of each template tag. */
function templateDeclaration(kind: LitTemplateKind): RegExp {
  switch (kind) {
    case "html":
      return HTML_DECLARATION;
    case "svg":
      return SVG_DECLARATION;
    case "css":
      return CSS_DECLARATION;
    default:
      return kind;
  }
}

/** Whether a name is one of Lit's template tags. */
function isTemplateKind(name: string): name is LitTemplateKind {
  return name === "html" || name === "svg" || name === "css";
}

/** The Lit template tag a binding is, or `null` for anything else. */
export function templateKindOf(binding: Binding | null): LitTemplateKind | null {
  if (binding?.kind !== "declaration") {
    return null;
  }
  const name = declarationName(binding.node);
  if (name === null || !isTemplateKind(name)) {
    return null;
  }
  return templateDeclaration(name).test(binding.module.path) ? name : null;
}

/** Whether a binding is Lit's `customElement` decorator. */
export function isCustomElementDecorator(binding: Binding | null): boolean {
  return (
    binding?.kind === "declaration" &&
    declarationName(binding.node) === "customElement" &&
    CUSTOM_ELEMENT_DECLARATION.test(binding.module.path)
  );
}

/** Whether a binding is `LitElement` or `ReactiveElement` itself. */
function isLitBase(binding: Binding): boolean {
  if (binding.kind !== "declaration") {
    return false;
  }
  const name = declarationName(binding.node);
  return (
    binding.node.type === "ClassDeclaration" &&
    name !== null &&
    LIT_BASE_NAMES.has(name) &&
    LIT_BASE_PACKAGES.test(binding.module.path)
  );
}

/** Declarations already followed while walking one heritage chain. */
export type Seen = Set<object>;

/**
 * Whether a binding is a Lit base class, or a class or value whose heritage
 * chain reaches one, following every file on the way.
 */
export function extendsLitBase(binding: Binding | null, seen: Seen = new Set()): boolean {
  if (binding?.kind !== "declaration" || seen.has(binding.node)) {
    return false;
  }
  seen.add(binding.node);
  if (isLitBase(binding)) {
    return true;
  }
  const node = binding.node;
  switch (node.type) {
    case "ClassDeclaration":
    case "ClassExpression":
      return (
        node.superClass !== null && expressionExtendsLit(binding.module, node.superClass, seen)
      );
    case "VariableDeclarator":
      if (node.init !== null) {
        return expressionExtendsLit(binding.module, node.init, seen);
      }
      // A declaration file types a mixin's result rather than calling it:
      // `declare const Base: typeof LitElement & Constructor<Mixed>`.
      return (
        node.id.type === "Identifier" &&
        node.id.typeAnnotation !== null &&
        node.id.typeAnnotation !== undefined &&
        typeExtendsLit(binding.module, node.id.typeAnnotation.typeAnnotation, seen)
      );
    default:
      return false;
  }
}

/**
 * Whether a value expression in another file is, or extends, a Lit base: a
 * name, `ns.Name` through a namespace import, a class expression, or a mixin
 * call `Mixin(Base)`, whose arguments are followed.
 */
export function expressionExtendsLit(module: ModuleFile, node: Expression, seen: Seen): boolean {
  switch (node.type) {
    case "Identifier":
      return extendsLitBase(resolveLocal(module, node.name), seen);
    case "MemberExpression": {
      if (node.computed || node.object.type !== "Identifier") {
        return false;
      }
      const namespace = resolveLocal(module, node.object.name);
      return (
        namespace?.kind === "namespace" &&
        extendsLitBase(resolveExport(namespace.module, node.property.name), seen)
      );
    }
    case "ClassExpression":
      return node.superClass !== null && expressionExtendsLit(module, node.superClass, seen);
    case "CallExpression":
      return node.arguments.some(
        (argument) =>
          argument.type !== "SpreadElement" && expressionExtendsLit(module, argument, seen),
      );
    case "TSAsExpression":
    case "TSSatisfiesExpression":
    case "TSNonNullExpression":
    case "ParenthesizedExpression":
      return expressionExtendsLit(module, node.expression, seen);
    default:
      return false;
  }
}

/** Whether a declared value's type is, or includes, `typeof` a Lit base. */
function typeExtendsLit(module: ModuleFile, node: TSType, seen: Seen): boolean {
  switch (node.type) {
    case "TSTypeQuery":
      return node.exprName.type === "Identifier"
        ? extendsLitBase(resolveLocal(module, node.exprName.name), seen)
        : false;
    case "TSIntersectionType":
      return node.types.some((type) => typeExtendsLit(module, type, seen));
    case "TSParenthesizedType":
      return typeExtendsLit(module, node.typeAnnotation, seen);
    default:
      return false;
  }
}
