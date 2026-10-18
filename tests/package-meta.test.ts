import { readFileSync } from "node:fs";
import { describe, expect, it } from "vite-plus/test";

import plugin from "#plugin";

/** The fields of `package.json` that `plugin.meta` repeats by hand. */
interface PackageIdentity {
  name: string;
  version: string;
}

/** `package.json`, read as text so the source never imports a non-`.ts` file. */
function readPackageIdentity(): PackageIdentity {
  const parsed: unknown = JSON.parse(
    readFileSync(new URL("../package.json", import.meta.url), "utf8"),
  );
  if (typeof parsed !== "object" || parsed === null) {
    throw new TypeError("package.json is not an object");
  }
  const name: unknown = Reflect.get(parsed, "name");
  const version: unknown = Reflect.get(parsed, "version");
  if (typeof name !== "string" || typeof version !== "string") {
    throw new TypeError("package.json lacks a string name or version");
  }
  return { name, version };
}

describe("plugin.meta", () => {
  const identity = readPackageIdentity();

  it("has the package name", () => {
    expect(plugin.meta?.name).toBe(identity.name);
  });

  it("has the package version", () => {
    expect(plugin.meta?.version).toBe(identity.version);
  });
});
