import type {
  LanguageOptions,
  Position,
  RuleDefinition,
  RuleVisitor,
  TextSourceCode,
} from "@eslint/core";
import type { TSESTree } from "@typescript-eslint/types";

/** One use of a variable, as both hosts' scope managers record it. */
export interface ScopeReference {
  identifier: TSESTree.Node;
}

/**
 * Where a variable is declared: `ImportBinding`, `ClassName`, `Variable`, and
 * so on, with the node that declares it and, for imports and variables, the
 * statement around that node.
 */
export interface ScopeDefinition {
  type: string;
  node: TSESTree.Node;
  parent: TSESTree.Node | null;
}

/** A declared name with every place it is declared and used. */
export interface ScopeVariable {
  name: string;
  scope: Scope;
  identifiers: TSESTree.Identifier[];
  references: ScopeReference[];
  defs: ScopeDefinition[];
}

/** A scope, e.g. `module` or `function`, with the names declared in it. */
export interface Scope {
  type: string;
  upper: Scope | null;
  set: Map<string, ScopeVariable>;
}

/** A host's global scope, whose `through` lists every reference left unresolved. */
export interface GlobalScope {
  through: ScopeReference[];
}

/** A host's scope analysis, as far as the rules read it. */
export interface ScopeManager {
  globalScope: GlobalScope | null;
}

/**
 * The source code both hosts hand a TypeScript rule: its text, plus the scope
 * lookups and offset conversion ESLint and Oxlint each implement on it.
 */
export interface LitSourceCode extends TextSourceCode {
  scopeManager: ScopeManager | null;
  getDeclaredVariables(node: TSESTree.Node): ScopeVariable[];
  getScope(node: TSESTree.Node): Scope;
  getLocFromIndex(index: number): Position;
}

/**
 * The type parameters of every rule in this package: ESLint's defaults, except
 * that a report points at a TypeScript-ESTree node.
 *
 * `Visitor` stays ESLint's loose `RuleVisitor`, so each visitor annotates its
 * node parameter itself. The type-aware `no-unsafe-*` lint rules in
 * `vite.config.ts` catch a parameter left as `any`.
 */
export interface LitRuleTypes {
  LangOptions: LanguageOptions;
  Code: LitSourceCode;
  RuleOptions: [];
  Visitor: RuleVisitor;
  Node: TSESTree.Node;
  MessageIds: string;
  ExtRuleDocs: unknown;
}

/** A rule in this package, in ESLint's standard `create` form. */
export type LitRule = RuleDefinition<LitRuleTypes>;

/** What every rule's `create` receives. */
export type LitRuleContext = Parameters<LitRule["create"]>[0];
