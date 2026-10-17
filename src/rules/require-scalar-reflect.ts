import type { TSESTree } from "@typescript-eslint/types";

import {
  classMembers,
  type ClassNode,
  docsUrl,
  findDecorator,
  isLitComponent,
  keyName,
  type LitRule,
} from "#helpers";

/**
 * Converters that produce an attribute a browser can round-trip.
 *
 * The test is inverted on purpose: reflection is rejected unless the options
 * prove the value is one of these. Listing the complex converters instead let
 * the worst case through, `{reflect: true}` with no `type` at all, where the
 * identity converter writes `[object Object]` into the DOM.
 */
const SCALAR_TYPES: ReadonlySet<string> = new Set(["String", "Number", "Boolean"]);

/** One entry of an options object literal, by key. */
function optionEntry(options: TSESTree.Node | null, name: string): TSESTree.Property | null {
  if (options?.type !== "ObjectExpression") {
    return null;
  }
  for (const entry of options.properties) {
    if (entry.type === "Property" && keyName(entry.key) === name) {
      return entry;
    }
  }
  return null;
}

/** The options object passed to `@property({…})`, if it is a literal. */
function decoratorOptions(decorator: TSESTree.Decorator): TSESTree.ObjectExpression | null {
  const expression = decorator.expression;
  if (expression.type !== "CallExpression") {
    return null;
  }
  const first = expression.arguments[0];
  return first?.type === "ObjectExpression" ? first : null;
}

/**
 * The offending `reflect: true` entry, when nothing in the options proves the
 * reflected value is a scalar.
 */
function violation(options: TSESTree.Node | null): TSESTree.Property | null {
  const reflect = optionEntry(options, "reflect");
  if (reflect === null || reflect.value.type !== "Literal" || reflect.value.value !== true) {
    return null;
  }
  // A custom converter decides its own attribute form; take its word for it.
  if (optionEntry(options, "converter") !== null) {
    return null;
  }
  const type = optionEntry(options, "type");
  // A `type` that is not a plain name, `TYPES.obj` or a call, is not evidence.
  if (type?.value.type === "Identifier" && SCALAR_TYPES.has(type.value.name)) {
    return null;
  }
  return reflect;
}

/**
 * `require-scalar-reflect` — rejects `reflect: true` unless the property's
 * `type` is `String`, `Number`, or `Boolean`, or it has its own converter,
 * whether declared with `@property` or in `static properties`.
 *
 * Reflection writes the value back into the attribute on every change; for an
 * object or array that is a JSON blob that re-parses into a new object, or
 * `[object Object]` with no `type` at all.
 */
export const requireScalarReflectRule: LitRule = {
  meta: {
    type: "problem",
    docs: {
      description: "Require reflected properties to declare a scalar type",
      url: docsUrl("require-scalar-reflect"),
    },
    schema: [],
    messages: {
      notScalar:
        'Property "{{name}}" reflects a value not declared as `String`, `Number`, or `Boolean`, so it is written into the DOM as a string.',
    },
  },
  create(context) {
    function report(found: TSESTree.Property, name: string): void {
      context.report({ node: found, messageId: "notScalar", data: { name } });
    }

    function check(node: ClassNode): void {
      if (!isLitComponent(node, context)) {
        return;
      }
      for (const member of classMembers(node)) {
        if (member.type !== "PropertyDefinition" && member.type !== "AccessorProperty") {
          continue;
        }
        const decorator = findDecorator(member.decorators, "property");
        if (decorator !== null) {
          const found = violation(decoratorOptions(decorator));
          const name = keyName(member.key);
          if (found !== null && name !== null) {
            report(found, name);
          }
          continue;
        }
        if (!member.static || keyName(member.key) !== "properties") {
          continue;
        }
        if (member.value?.type !== "ObjectExpression") {
          continue;
        }
        for (const entry of member.value.properties) {
          const name = entry.type === "Property" ? keyName(entry.key) : null;
          const found = entry.type === "Property" ? violation(entry.value) : null;
          if (name !== null && found !== null) {
            report(found, name);
          }
        }
      }
    }

    return {
      ClassDeclaration(node: TSESTree.ClassDeclaration): void {
        check(node);
      },
      ClassExpression(node: TSESTree.ClassExpression): void {
        check(node);
      },
    };
  },
};
