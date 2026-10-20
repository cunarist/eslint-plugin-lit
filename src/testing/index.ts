/**
 * Shared harness for rule tests: every case runs under both ESLint's and
 * Oxlint's `RuleTester`, wired into Vitest.
 *
 * Imported only by `*.test.ts` files, never by the plugin, so neither tester
 * ends up in the published bundle. No ESLint config file is involved: each
 * tester is configured here.
 */

import type { RuleDefinition } from "@eslint/core";
import tsParser from "@typescript-eslint/parser";
import { RuleTester as EslintRuleTester } from "eslint";
import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { RuleTester as OxlintRuleTester } from "vite-plus/lint/plugins-dev";
import { afterAll, describe, it } from "vite-plus/test";

EslintRuleTester.describe = describe;
EslintRuleTester.it = it;
EslintRuleTester.itOnly = it.only;
OxlintRuleTester.describe = (text, fn) => {
  describe(text, fn);
};
OxlintRuleTester.it = it;

/**
 * The filename a snippet is linted as unless its case names another, so both
 * parsers read TypeScript. Relative to the repository root, where `lit` is
 * installed, so the snippet's imports of Lit resolve the way they would in a
 * project. A case that needs other files names one inside a `writeProject`
 * directory instead.
 */
const FILENAME = "example.ts";

/** The absolute path a case is linted as, which cross-file lookups start from. */
function filenameOf(filename?: string): string {
  return resolve(filename ?? FILENAME);
}

const eslintTester = new EslintRuleTester({
  languageOptions: { parser: tsParser },
});

/**
 * Oxlint's tester. Its `run` is typed against Oxlint's own `Rule`, which
 * ESLint's `RuleDefinition` does not satisfy on paper - `meta.docs` lacks an
 * index signature and the two `sourceCode` shapes differ - although Oxlint runs
 * ESLint rules as they are. `runOxlint` is the one place the two type systems
 * are bridged; the Oxlint half of every test is what proves the runtime agrees.
 */
const oxlintTester = new OxlintRuleTester({
  languageOptions: { parserOptions: { lang: "ts" } },
});

/** Runs Oxlint's tester on an ESLint rule, through `Reflect.apply`'s untyped arguments. */
function runOxlint(name: string, rule: RuleDefinition, cases: OxlintRuleTester.TestCases): void {
  Reflect.apply(oxlintTester.run.bind(oxlintTester), undefined, [name, rule, cases]);
}

/**
 * Writes a throwaway project, `files` keyed by path relative to its root, for
 * rules that read other files: a case then names one of them as its
 * `filename`. The repository's `node_modules` is linked in, so `lit` resolves.
 * The project lives outside the repository, where nothing lints or
 * type-checks it, and is deleted after the test file. Returns its root.
 */
export function writeProject(files: Map<string, string>): string {
  const root = mkdtempSync(join(tmpdir(), "eslint-plugin-lit-robust-"));
  symlinkSync(resolve("node_modules"), join(root, "node_modules"), "dir");
  for (const [path, text] of files) {
    const file = join(root, path);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, text);
  }
  afterAll(() => {
    rmSync(root, { recursive: true, force: true });
  });
  return root;
}

/** A valid case that names the file it is linted as. */
export interface ValidCase {
  code: string;
  filename: string;
}

/** The cases one rule is tested against, written in ESLint's shape. */
interface RuleCases {
  valid: (string | ValidCase)[];
  invalid: EslintRuleTester.InvalidTestCase[];
}

/** A valid case with its filename made absolute. */
function validCase(test: string | ValidCase): ValidCase {
  return typeof test === "string"
    ? { code: test, filename: filenameOf() }
    : { code: test.code, filename: filenameOf(test.filename) };
}

/** An expected error, in ESLint's shape. */
export type ExpectedError = EslintRuleTester.TestCaseError;

/** An expected suggestion and the code it leaves, in ESLint's shape. */
export type ExpectedSuggestion = EslintRuleTester.SuggestionOutput;

/**
 * Where a diagnostic should land, counted the way ESLint counts: lines and
 * columns both from 1. The Oxlint run shifts columns to its 0-based count.
 */
interface ReportedSpan {
  line: number;
  column: number;
  endLine: number;
  endColumn: number;
}

/**
 * The span of the first occurrence of `text` in `code`. A rule can fire
 * correctly while highlighting the wrong characters; this is what catches that.
 */
export function spanOf(code: string, text: string): ReportedSpan {
  const start = code.indexOf(text);
  if (start === -1) {
    throw new Error(`${JSON.stringify(text)} is not in the code`);
  }
  const begin = position(code, start);
  const end = position(code, start + text.length);
  return {
    line: begin.line,
    column: begin.column,
    endLine: end.line,
    endColumn: end.column,
  };
}

/** A line and column within source text. */
interface Position {
  line: number;
  column: number;
}

/** The 1-indexed line and 1-indexed column of an offset. */
function position(code: string, offset: number): Position {
  const before = code.slice(0, offset).split("\n");
  return {
    line: before.length,
    column: (before.at(-1)?.length ?? 0) + 1,
  };
}

/**
 * Run one rule over all its valid and invalid snippets, under ESLint and
 * Oxlint. Each rule's test file calls this once. The suites nest as
 * `<rule> > eslint|oxlint`, so a full test name contains ` eslint ` or
 * ` oxlint `, which is what CI filters each host's step by.
 */
export function testRule(name: string, rule: RuleDefinition, cases: RuleCases): void {
  const valid = cases.valid.map(validCase);
  describe(name, () => {
    describe("eslint", () => {
      eslintTester.run(name, rule, {
        valid,
        invalid: cases.invalid.map((test) => ({ ...test, filename: filenameOf(test.filename) })),
      });
    });
    describe("oxlint", () => {
      runOxlint(name, rule, {
        valid,
        invalid: cases.invalid.map((test) => ({
          code: test.code,
          filename: filenameOf(test.filename),
          errors: oxlintErrors(test.errors),
          ...(test.output === undefined ? {} : { output: test.output }),
        })),
      });
    });
  });
}

/** ESLint's expected errors, with columns shifted to Oxlint's 0-based count. */
function oxlintErrors(
  errors: EslintRuleTester.InvalidTestCase["errors"],
): OxlintRuleTester.InvalidTestCase["errors"] {
  if (typeof errors === "number") {
    return errors;
  }
  return errors.map((error) => {
    if (typeof error === "string") {
      return error;
    }
    const shifted: OxlintRuleTester.Error = { ...oxlintMessage(error) };
    if (error.suggestions !== undefined) {
      shifted.suggestions = oxlintSuggestions(error.suggestions);
    }
    if (error.line !== undefined) {
      shifted.line = error.line;
    }
    if (error.endLine !== undefined) {
      shifted.endLine = error.endLine;
    }
    if (error.column !== undefined) {
      shifted.column = error.column - 1;
    }
    if (error.endColumn !== undefined) {
      shifted.endColumn = error.endColumn - 1;
    }
    return shifted;
  });
}

/** ESLint's expected suggestions, in the shape Oxlint reads. */
function oxlintSuggestions(
  suggestions: EslintRuleTester.SuggestionOutput[] | null,
): OxlintRuleTester.ErrorSuggestion[] | null {
  if (suggestions === null) {
    return null;
  }
  return suggestions.map((suggestion) => {
    const expected: OxlintRuleTester.ErrorSuggestion = { output: suggestion.output };
    if (suggestion.messageId !== undefined) {
      expected.messageId = suggestion.messageId;
    }
    if (suggestion.desc !== undefined) {
      expected.desc = suggestion.desc;
    }
    if (suggestion.data !== undefined) {
      expected.data = Object.fromEntries(stringEntries(suggestion.data));
    }
    return expected;
  });
}

/** The message half of an expected error, which both testers read alike. */
function oxlintMessage(error: EslintRuleTester.TestCaseError): OxlintRuleTester.Error {
  if (error.messageId !== undefined) {
    return error.data === undefined
      ? { messageId: error.messageId }
      : { messageId: error.messageId, data: Object.fromEntries(stringEntries(error.data)) };
  }
  if (error.message !== undefined) {
    return { message: error.message };
  }
  throw new Error("an expected error needs a messageId or a message");
}

/**
 * Placeholder data as Oxlint types it. ESLint types it `any`; every
 * placeholder in this package is a string, so anything else is a test bug.
 */
function stringEntries(data: unknown): [string, string][] {
  if (typeof data !== "object" || data === null) {
    throw new Error("data is not an object");
  }
  return Object.entries(data).map(([key, value]) => {
    if (typeof value !== "string") {
      throw new TypeError(`placeholder ${key} is not a string`);
    }
    return [key, value];
  });
}
