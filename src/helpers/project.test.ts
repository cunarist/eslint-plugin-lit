import { readdirSync, realpathSync, rmSync, utimesSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

import { beforeAll, describe, expect, it, vi } from "vite-plus/test";

import { writeProject } from "#testing";

import { projectFiles } from "./project.ts";
import { registrationIndex } from "./registration.ts";

// Every `node:fs` function becomes a spy that keeps its behavior, so a test
// can count the folders a lookup reads.
vi.mock(import("node:fs"), { spy: true });

/** A file that registers one tag. */
function element(tag: string): string {
  return `customElements.define("${tag}", class extends HTMLElement {});\n`;
}

/** The folders read so far, relative to a project root. */
function foldersRead(written: string): string[] {
  const root = realpathSync.native(written);
  return vi
    .mocked(readdirSync)
    .mock.calls.map(([path]) => String(path))
    .filter((path) => path.startsWith(root))
    .map((path) => path.slice(root.length));
}

const files = new Map([
  ["tsconfig.json", `{ "exclude": ["dist"] }\n`],
  ["src/a.ts", element("cl-a")],
  ["src/b.ts", element("cl-b")],
  ["src/nested/c.ts", element("cl-c")],
  ["dist/a.ts", element("cl-dist")],
  ["packages/x/node_modules/dep/index.ts", element("cl-dep")],
  [".cache/d.ts", element("cl-cache")],
]);
const root = writeProject(files);

/** Moves every written file and folder's `mtime` back past the racy window. */
function backdate(): void {
  const past = new Date(Date.now() - 60_000);
  const paths = new Set([root]);
  for (const file of files.keys()) {
    for (let path = file; path !== "."; path = dirname(path)) {
      paths.add(join(root, path));
    }
  }
  for (const path of paths) {
    utimesSync(path, past, past);
  }
}

describe("project listing", () => {
  beforeAll(() => {
    // Age the written folders' mtimes past the racy window, without waiting.
    backdate();
  });

  it("walks the project once, never reading excluded folders", () => {
    vi.mocked(readdirSync).mockClear();
    const index = registrationIndex(join(root, "src/a.ts"));
    expect([...index.keys()].toSorted()).toEqual(["cl-a", "cl-b", "cl-c"]);
    const read = foldersRead(root);
    expect(read.length).toBeGreaterThan(0);
    expect(read.filter((path) => /dist|node_modules|\.cache/u.test(path))).toEqual([]);
    for (const file of ["src/b.ts", "src/nested/c.ts", "src/a.ts", "src/b.ts"]) {
      expect(registrationIndex(join(root, file))).toBe(index);
    }
    expect(foldersRead(root)).toEqual(read);
  });

  it("sees files added and removed after the first lookup", () => {
    const before = projectFiles(root);
    writeFileSync(join(root, "src/nested/e.ts"), element("cl-e"));
    expect(registrationIndex(join(root, "src/a.ts")).has("cl-e")).toBe(true);
    expect(projectFiles(root)).toHaveLength(before.length + 1);
    rmSync(join(root, "src/nested/e.ts"));
    expect(registrationIndex(join(root, "src/a.ts")).has("cl-e")).toBe(false);
    expect(projectFiles(root)).toEqual(before);
  });
});
