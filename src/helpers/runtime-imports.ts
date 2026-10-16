/**
 * Which modules the linted file runs: its own runtime imports and re-exports,
 * plus what an imported barrel runs from inside its own folder.
 */

import type { Program } from "oxc-parser";

import type { ModuleFile } from "./modules.ts";
import { importedModule } from "./modules.ts";

/** The file name of a folder's barrel, which stands for the whole folder. */
const BARREL = "index.ts";

/** The directory a barrel covers, or null for any other file. */
function barrelScope(path: string): string | null {
  const cut = path.lastIndexOf("/");
  return path.slice(cut + 1) === BARREL ? path.slice(0, cut + 1) : null;
}

/** Whether an import executes its module rather than being fully erased. */
function runsImport(statement: Program["body"][number]): boolean {
  if (statement.type === "ImportDeclaration") {
    if (statement.importKind === "type") {
      return false;
    }
    const specifiers = statement.specifiers;
    return (
      specifiers.length === 0 ||
      specifiers.some(
        (specifier) => specifier.type !== "ImportSpecifier" || specifier.importKind !== "type",
      )
    );
  }
  if (statement.type === "ExportAllDeclaration") {
    return statement.exportKind !== "type";
  }
  if (statement.type === "ExportNamedDeclaration" && statement.source !== null) {
    return (
      statement.exportKind !== "type" &&
      (statement.specifiers.length === 0 ||
        statement.specifiers.some((specifier) => specifier.exportKind !== "type"))
    );
  }
  return false;
}

/** The module specifier of a statement that runs its module, else null. */
function runtimeSpecifier(statement: Program["body"][number]): string | null {
  if (!runsImport(statement)) {
    return null;
  }
  switch (statement.type) {
    case "ImportDeclaration":
    case "ExportAllDeclaration":
      return statement.source.value;
    case "ExportNamedDeclaration":
      return statement.source?.value ?? null;
    default:
      return null;
  }
}

/**
 * The files a module runs through its own runtime imports and re-exports, plus
 * the ones an imported barrel runs from inside its own directory tree.
 *
 * A barrel stands for the folder it sits in, so importing it is a real reason
 * for anything under that folder to have run. An arbitrary re-exporting file
 * is not: it can pull in a module from anywhere, which is the borrowed import
 * `require-direct-registration-import` exists to reject. Type-only imports and
 * re-exports are erased and never run their module, so they do not count.
 */
export function runtimeImportedFiles(module: ModuleFile): ReadonlySet<string> {
  const files = new Set<string>();
  const visited = new Set([module.path]);
  const pending: { module: ModuleFile; scope: string | null }[] = [{ module, scope: null }];
  for (let at = 0; at < pending.length; at += 1) {
    const current = pending[at];
    if (current === undefined) {
      continue;
    }
    for (const statement of current.module.program.body) {
      const specifier = runtimeSpecifier(statement);
      const imported = specifier === null ? null : importedModule(current.module.path, specifier);
      if (
        imported === null ||
        visited.has(imported.path) ||
        (current.scope !== null && !imported.path.startsWith(current.scope))
      ) {
        continue;
      }
      visited.add(imported.path);
      files.add(imported.path);
      const scope = barrelScope(imported.path);
      if (scope !== null) {
        pending.push({ module: imported, scope });
      }
    }
  }
  return files;
}
