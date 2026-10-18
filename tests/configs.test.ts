import type { ConfigObject } from "@eslint/core";
import { describe, expect, it } from "vite-plus/test";

import plugin from "#plugin";

const NAMESPACE = "lit-robust";

/**
 * The rules of the Deno package this one ports, by the Deno plugin each came
 * from, which is the config it belongs to. A repo-only rule goes in
 * `scripts/project-lint.ts`, never in the published plugin.
 */
const DENO_GROUPS: Map<string, string[]> = new Map([
  [
    "core",
    [
      "attribute-value-entities",
      "binding-positions",
      "composed-requires-bubbles",
      "lifecycle-super",
      "no-array-mutation-without-reassign",
      "no-async-lifecycle",
      "no-async-render",
      "no-attribute-property-binding-conflict",
      "no-classfield-shadowing",
      "no-context-mutation-by-consumer",
      "no-dispatch-in-render",
      "no-duplicate-context-provider",
      "no-duplicate-property-declaration",
      "no-duplicate-slot-names",
      "no-duplicate-tag-registration",
      "no-duplicate-template-bindings",
      "no-index-as-repeat-key",
      "no-inline-event-attribute",
      "no-inner-html-assignment",
      "no-invalid-escape-sequences",
      "no-invalid-html",
      "no-jsx-attribute-names",
      "no-legacy-imports",
      "no-legacy-template-syntax",
      "no-multiple-default-slots",
      "no-native-attributes",
      "no-partial-property-binding",
      "no-private-properties",
      "no-property-change-in-updated",
      "no-property-change-update",
      "no-property-named-like-lifecycle",
      "no-request-update-in-updated",
      "no-script-in-template",
      "no-self-closing-non-void",
      "no-this-assign-in-render",
      "no-this-in-static-styles",
      "no-unsafe-css",
      "no-unsafe-html",
      "no-useless-template-literals",
      "no-value-attribute",
      "prefer-static-styles",
      "require-accessor-with-decorators",
      "require-context-type",
      "require-dashed-tag",
      "require-direct-registration-import",
      "require-dispatch-on-this",
      "require-property-type",
      "require-repeat-key",
      "require-scalar-reflect",
      "simple-template-expressions",
      "svg-template-for-svg-content",
      "value-after-constraints",
    ],
  ],
  [
    "strict",
    [
      "directive-allowlist",
      "no-boolean-property-default-true",
      "no-event-target-subclass",
      "no-light-dom",
      "no-manual-update",
      "no-property-assignment-in-constructor",
      "no-string-context-key",
      "no-update-complete",
      "prefer-context-decorators",
      "prefer-decorators",
      "require-custom-element-registration",
      "require-event-in-event-map",
      "require-tag-name-map",
    ],
  ],
  ["dom-ref", ["no-dom-query", "no-query-decorators", "prefer-create-ref"]],
  [
    "reactive-controller",
    [
      "host-constructor",
      "lifecycle-allowlist",
      "no-component-disposables",
      "no-fetch-in-component",
      "no-timers",
      "paired-lifecycle",
      "self-registration",
    ],
  ],
  [
    "naming",
    [
      "attribute-names",
      "event-name-case",
      "no-camelcase-attribute",
      "require-controller-suffix",
      "require-element-suffix",
      "require-tag-prefix",
      "tag-matches-class-name",
    ],
  ],
]);

/** Every rule of the Deno package. */
const DENO_RULES: string[] = [...DENO_GROUPS.values()].flat();

/** The preset configs, by the name of the Deno plugin each stands for. */
const PRESETS: Map<string, ConfigObject> = new Map([
  ["core", plugin.configs.core],
  ["strict", plugin.configs.strict],
  ["dom-ref", plugin.configs["dom-ref"]],
  ["reactive-controller", plugin.configs["reactive-controller"]],
  ["naming", plugin.configs.naming],
]);

/** The rule ids a preset config turns on, without the namespace. */
function configRuleIds(name: string): string[] {
  const rules = PRESETS.get(name)?.rules ?? {};
  return Object.keys(rules).map((id) => id.slice(NAMESPACE.length + 1));
}

describe("plugin.rules", () => {
  it("holds exactly the 82 rules of the Deno package", () => {
    expect(DENO_RULES).toHaveLength(82);
    expect(Object.keys(plugin.rules ?? {}).toSorted()).toEqual(DENO_RULES.toSorted());
  });
});

describe("plugin.configs", () => {
  it("has one config per Deno plugin, plus all", () => {
    expect(Object.keys(plugin.configs).toSorted()).toEqual(
      [...DENO_GROUPS.keys(), "all"].toSorted(),
    );
  });

  it("turns on exactly the rules of each Deno plugin", () => {
    for (const [group, ids] of DENO_GROUPS) {
      expect(configRuleIds(group).toSorted()).toEqual(ids.toSorted());
    }
  });
});

describe("plugin.configs.all", () => {
  it("turns on every rule in the plugin", () => {
    expect(Object.keys(plugin.configs.all.rules ?? {})).toHaveLength(82);
    const ruleIds = Object.keys(plugin.rules ?? {}).map((id) => `${NAMESPACE}/${id}`);
    expect(Object.keys(plugin.configs.all.rules ?? {}).toSorted()).toEqual(ruleIds.toSorted());
  });

  it("equals the union of the five preset configs", () => {
    expect(plugin.configs.all.rules).toEqual({
      ...plugin.configs.core.rules,
      ...plugin.configs.strict.rules,
      ...plugin.configs["dom-ref"].rules,
      ...plugin.configs["reactive-controller"].rules,
      ...plugin.configs.naming.rules,
    });
  });
});
