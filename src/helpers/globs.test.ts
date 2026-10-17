import path from "node:path";

import { describe, expect, it } from "vite-plus/test";

import { excludedFolder, matchesDotSegments, matchesGlob, patternBase } from "./globs.ts";

const PATTERNS: readonly string[] = [
  "**/*",
  "src/**/*",
  "src/*.ts",
  "src/**/*.test.ts",
  "{src,tests}/**/*",
  "src/?.ts",
  ".storybook/**/*",
  "dist/**",
];

const PATHS: readonly string[] = [
  "a.ts",
  "src/a.ts",
  "src/b.test.ts",
  "src/nested/c.ts",
  "src/nested/c.test.ts",
  "src/.hidden/d.ts",
  "tests/e.ts",
  ".storybook/main.ts",
  "dist/a.ts",
  "dist/deep/b.ts",
];

describe("glob matching", () => {
  it("decides every path the way Node's path.matchesGlob does", () => {
    for (const pattern of PATTERNS) {
      for (const file of PATHS) {
        expect(matchesGlob(file, pattern), `${file} against ${pattern}`).toBe(
          path.matchesGlob(file, pattern),
        );
      }
    }
  });

  it("finds the literal folder a pattern starts in", () => {
    expect(patternBase("src/**/*")).toEqual({ base: "src", literal: false });
    expect(patternBase("**/*")).toEqual({ base: "", literal: false });
    expect(patternBase("src/index.ts")).toEqual({ base: "src/index.ts", literal: true });
  });

  it("tells which patterns can reach dot segments", () => {
    expect(matchesDotSegments("src/**/*")).toBe(false);
    expect(matchesDotSegments("../shared/**/*")).toBe(false);
    expect(matchesDotSegments(".storybook/**/*")).toBe(true);
    expect(matchesDotSegments("{src,.config}/**/*")).toBe(true);
  });

  it("prunes only literal folders excluded whole", () => {
    expect(excludedFolder("dist/**/*")).toBe("dist");
    expect(excludedFolder("dist/**")).toBe("dist");
    expect(excludedFolder("out/*/gen/**")).toBeNull();
    expect(excludedFolder("dist/*.ts")).toBeNull();
  });
});
