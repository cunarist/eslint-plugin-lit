/**
 * `eslint-plugin-lit-robust` — lint rules for Lit web components.
 *
 * One plugin, namespace `lit-robust`, so a rule id reads
 * `lit-robust/no-unsafe-html`. The rules come in five presets, one per
 * plugin of the Deno package this ports — `core`, `strict`, `dom-ref`,
 * `reactive-controller`, and `naming` — plus `all`, which turns on every rule.
 * The plugin is the only export; its configs are at `plugin.configs`.
 *
 * @module
 */

import type { ConfigObject, Plugin } from "@eslint/core";

import { rules } from "#rules";

/** The prefix of every rule id, as ESLint derives it from the package name. */
const NAMESPACE = "lit-robust";

/**
 * The `core` preset — Lit code that does not do what it looks like it does.
 */
const CORE: string[] = [
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
];

/**
 * The `strict` preset — demanding but correct. Strongly recommended, not
 * required.
 */
const STRICT: string[] = [
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
];

/**
 * The `dom-ref` preset — reach the DOM through a `createRef` ref, nothing else.
 */
const DOM_REF: string[] = ["no-dom-query", "no-query-decorators", "prefer-create-ref"];

/**
 * The `reactive-controller` preset — the ReactiveController contract, and the
 * component lifecycle work that belongs in one.
 */
const REACTIVE_CONTROLLER: string[] = [
  "host-constructor",
  "lifecycle-allowlist",
  "no-component-disposables",
  "no-fetch-in-component",
  "no-timers",
  "paired-lifecycle",
  "self-registration",
];

/**
 * The `naming` preset — what elements, controllers, attributes, and events are
 * called.
 */
const NAMING: string[] = [
  "attribute-names",
  "event-name-case",
  "no-camelcase-attribute",
  "require-controller-suffix",
  "require-element-suffix",
  "require-tag-prefix",
  "tag-matches-class-name",
];

/** The flat configs at `plugin.configs`, one per preset plus `all`. */
interface LitConfigs {
  core: ConfigObject;
  strict: ConfigObject;
  "dom-ref": ConfigObject;
  "reactive-controller": ConfigObject;
  naming: ConfigObject;
  all: ConfigObject;
}

/** The plugin, with its configs known by name. */
interface LitPlugin {
  meta?: Plugin["meta"];
  rules?: Plugin["rules"];
  configs: LitConfigs;
}

/** The plugin before its configs exist, which each config refers back to. */
const basePlugin: Plugin = {
  meta: {
    // Written out rather than imported from `package.json`, so the source has
    // only `.ts` imports. A release bumps both; `tests/package-meta.test.ts`
    // fails if they drift apart.
    name: "eslint-plugin-lit-robust",
    version: "0.8.0",
    namespace: NAMESPACE,
  },
  rules: Object.fromEntries(rules),
};

/**
 * A flat config that loads the plugin and turns every given rule on. A config
 * is only a list of rule ids, so one rule can sit in several configs.
 */
function presetConfig(preset: string, ruleIds: string[]): ConfigObject {
  return {
    name: `${NAMESPACE}/${preset}`,
    plugins: Object.fromEntries([[NAMESPACE, basePlugin]]),
    rules: Object.fromEntries(ruleIds.map((id) => [`${NAMESPACE}/${id}`, "error"])),
  };
}

/**
 * The plugin, for ESLint `plugins` or Oxlint `jsPlugins`, and the package's
 * only export. Configs: `core` catches Lit code that does not do what it looks
 * like it does, `strict` is demanding but correct, `dom-ref` reaches the DOM
 * only through refs, `reactive-controller` keeps lifetimes in controllers,
 * `naming` governs what things are called, and `all` turns on every rule, so a
 * new rule joins it by itself.
 */
const plugin: LitPlugin = Object.assign(basePlugin, {
  configs: {
    core: presetConfig("core", CORE),
    strict: presetConfig("strict", STRICT),
    "dom-ref": presetConfig("dom-ref", DOM_REF),
    "reactive-controller": presetConfig("reactive-controller", REACTIVE_CONTROLLER),
    naming: presetConfig("naming", NAMING),
    all: presetConfig("all", [...rules.keys()]),
  },
});

export default plugin;
