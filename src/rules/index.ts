/**
 * Every rule in the plugin, one file each, registered here by rule id. Which
 * configs turn a rule on is decided in `src/index.ts`, not here, because a rule
 * can belong to more than one config.
 */

import type { LitRule } from "#helpers";

import { noDomQueryRule } from "./no-dom-query.ts";
import { noQueryDecoratorsRule } from "./no-query-decorators.ts";
import { preferCreateRefRule } from "./prefer-create-ref.ts";

/**
 * Every rule, keyed by rule id, in alphabetical order.
 *
 * A `Map` rather than an object literal: a rule record is a lookup keyed by
 * rule id, so the ids belong in value position.
 */
export const rules: Map<string, LitRule> = new Map([
  ["no-dom-query", noDomQueryRule],
  ["no-query-decorators", noQueryDecoratorsRule],
  ["prefer-create-ref", preferCreateRefRule],
]);
