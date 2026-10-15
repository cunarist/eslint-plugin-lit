/**
 * Every rule in the plugin, one file each, registered here by rule id. Which
 * configs turn a rule on is decided in `src/index.ts`, not here, because a rule
 * can belong to more than one config.
 */

import type { LitRule } from "#helpers";

import { hostConstructorRule } from "./host-constructor.ts";
import { lifecycleAllowlistRule } from "./lifecycle-allowlist.ts";
import { noComponentDisposablesRule } from "./no-component-disposables.ts";
import { noDomQueryRule } from "./no-dom-query.ts";
import { noFetchInComponentRule } from "./no-fetch-in-component.ts";
import { noQueryDecoratorsRule } from "./no-query-decorators.ts";
import { noTimersRule } from "./no-timers.ts";
import { pairedLifecycleRule } from "./paired-lifecycle.ts";
import { preferCreateRefRule } from "./prefer-create-ref.ts";
import { selfRegistrationRule } from "./self-registration.ts";

/**
 * Every rule, keyed by rule id, in alphabetical order.
 *
 * A `Map` rather than an object literal: a rule record is a lookup keyed by
 * rule id, so the ids belong in value position.
 */
export const rules: Map<string, LitRule> = new Map([
  ["host-constructor", hostConstructorRule],
  ["lifecycle-allowlist", lifecycleAllowlistRule],
  ["no-component-disposables", noComponentDisposablesRule],
  ["no-dom-query", noDomQueryRule],
  ["no-fetch-in-component", noFetchInComponentRule],
  ["no-query-decorators", noQueryDecoratorsRule],
  ["no-timers", noTimersRule],
  ["paired-lifecycle", pairedLifecycleRule],
  ["prefer-create-ref", preferCreateRefRule],
  ["self-registration", selfRegistrationRule],
]);
