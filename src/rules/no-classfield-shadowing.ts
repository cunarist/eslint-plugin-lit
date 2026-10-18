import type { TSESTree } from "@typescript-eslint/types";

import {
  type ClassMember,
  classMembers,
  type ClassNode,
  docsUrl,
  isLitComponent,
  isReactiveProperty,
  keyName,
  type LitRule,
  parentOf,
} from "#helpers";

/** Depth limit for walking a superclass chain, as a cycle guard. */
const MAX_DEPTH = 16;

/** Name of an object-literal key, for `static properties` entries. */
function objectKeyName(key: TSESTree.Node): string | null {
  if (key.type === "Identifier") {
    return key.name;
  }
  return key.type === "Literal" && typeof key.value === "string" ? key.value : null;
}

/** Names declared by a class's `static properties` object, if any. */
function staticPropertyNames(node: ClassNode): Set<string> {
  const names = new Set<string>();
  for (const member of classMembers(node)) {
    if (
      member.type !== "PropertyDefinition" ||
      !member.static ||
      keyName(member.key) !== "properties" ||
      member.value?.type !== "ObjectExpression"
    ) {
      continue;
    }
    for (const entry of member.value.properties) {
      const name = entry.type === "Property" ? objectKeyName(entry.key) : null;
      if (name !== null) {
        names.add(name);
      }
    }
  }
  return names;
}

/** Every reactive property name a class declares, decorated or static. */
function reactivePropertyNames(node: ClassNode): Set<string> {
  const names = staticPropertyNames(node);
  for (const member of classMembers(node)) {
    if (
      (member.type === "PropertyDefinition" || member.type === "AccessorProperty") &&
      isReactiveProperty(member)
    ) {
      const name = keyName(member.key);
      if (name !== null) {
        names.add(name);
      }
    }
  }
  return names;
}

/** The enclosing `Program`, reached through parent links. */
function programOf(node: TSESTree.Node): TSESTree.Program | null {
  let current: TSESTree.Node | null = node;
  while (current !== null) {
    if (current.type === "Program") {
      return current;
    }
    current = parentOf(current);
  }
  return null;
}

/** A top-level class declaration by name, unwrapping `export class X`. */
function findClassNamed(program: TSESTree.Program, name: string): TSESTree.ClassDeclaration | null {
  for (const statement of program.body) {
    const declaration =
      statement.type === "ExportNamedDeclaration" ? statement.declaration : statement;
    if (declaration?.type === "ClassDeclaration" && declaration.id?.name === name) {
      return declaration;
    }
  }
  return null;
}

/**
 * Ancestor classes declared in the same module, nearest first, or null when
 * the class is not a Lit component. `isLitComponent` already follows the
 * superclass chain; this re-walks it only to collect the same-module ancestors
 * whose reactive properties a field here could shadow.
 */
function litAncestors(
  node: ClassNode,
  context: Parameters<LitRule["create"]>[0],
): ClassNode[] | null {
  if (!isLitComponent(node, context)) {
    return null;
  }
  const program = programOf(node);
  if (program === null) {
    return [];
  }
  const ancestors: ClassNode[] = [];
  let current: ClassNode = node;
  for (let depth = 0; depth < MAX_DEPTH; depth += 1) {
    const superClass = current.superClass;
    if (superClass?.type !== "Identifier") {
      break;
    }
    const parent = findClassNamed(program, superClass.name);
    if (parent === null || parent === current) {
      break;
    }
    ancestors.push(parent);
    current = parent;
  }
  return ancestors;
}

/** Whether a member is a plain, emitted instance field. */
function isPlainInstanceField(member: ClassMember): member is TSESTree.PropertyDefinition {
  return (
    member.type === "PropertyDefinition" &&
    !member.static &&
    !member.declare &&
    !isReactiveProperty(member)
  );
}

/**
 * Whether `declare ` can go in front of a field as written: it has no value to
 * lose and no decorator or modifier that would have to stay before it.
 */
function canDeclare(member: TSESTree.PropertyDefinition): boolean {
  return (
    member.value === null &&
    member.decorators.length === 0 &&
    // Oxlint leaves an absent modifier `null` where ESLint leaves it out.
    !member.accessibility &&
    !member.override
  );
}

/**
 * `no-classfield-shadowing` — rejects a plain class field whose name matches a
 * reactive property.
 *
 * With `useDefineForClassFields` a class field is emitted as
 * `Object.defineProperty`, which overwrites the accessor Lit installed for the
 * reactive property, so the property stops reacting. Caught: a field shadowing
 * a reactive property of an ancestor class in the same module, and a field
 * shadowing an entry of the same class's `static properties`.
 */
export const noClassfieldShadowingRule: LitRule = {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow class fields that shadow reactive properties",
      url: docsUrl("no-classfield-shadowing"),
    },
    hasSuggestions: true,
    schema: [],
    messages: {
      shadowing:
        "Unexpected class field `{{name}}` shadowing a reactive property; it overwrites Lit's accessor.",
      declare: "Make it a `declare` field, which emits nothing.",
    },
  },
  create(context) {
    function check(node: ClassNode): void {
      const ancestors = litAncestors(node, context);
      if (ancestors === null) {
        return;
      }
      const shadowed = staticPropertyNames(node);
      for (const ancestor of ancestors) {
        for (const name of reactivePropertyNames(ancestor)) {
          shadowed.add(name);
        }
      }
      for (const member of classMembers(node)) {
        if (!isPlainInstanceField(member)) {
          continue;
        }
        const name = keyName(member.key);
        if (name === null || !shadowed.has(name)) {
          continue;
        }
        context.report({
          node: member.key,
          messageId: "shadowing",
          data: { name },
          suggest: canDeclare(member)
            ? [
                {
                  messageId: "declare",
                  fix: (fixer) => fixer.insertTextBeforeRange(member.range, "declare "),
                },
              ]
            : [],
        });
      }
    }

    return {
      ClassDeclaration: check,
      ClassExpression: check,
    };
  },
};
