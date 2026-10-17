import { describe, expect, it } from "vite-plus/test";

import { excludedFolder, matchesDotSegments, patternBase } from "./globs.ts";

describe("glob helpers", () => {
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
