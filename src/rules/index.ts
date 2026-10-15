/**
 * Every rule in the plugin, one file each, registered here by rule id. Which
 * configs turn a rule on is decided in `src/index.ts`, not here, because a rule
 * can belong to more than one config.
 */

import type { LitRule } from "#helpers";

import { directiveAllowlistRule } from "./directive-allowlist.ts";
import { hostConstructorRule } from "./host-constructor.ts";
import { lifecycleAllowlistRule } from "./lifecycle-allowlist.ts";
import { noBooleanPropertyDefaultTrueRule } from "./no-boolean-property-default-true.ts";
import { noComponentDisposablesRule } from "./no-component-disposables.ts";
import { noDomQueryRule } from "./no-dom-query.ts";
import { noEventTargetSubclassRule } from "./no-event-target-subclass.ts";
import { noFetchInComponentRule } from "./no-fetch-in-component.ts";
import { noLightDomRule } from "./no-light-dom.ts";
import { noManualUpdateRule } from "./no-manual-update.ts";
import { noPropertyAssignmentInConstructorRule } from "./no-property-assignment-in-constructor.ts";
import { noQueryDecoratorsRule } from "./no-query-decorators.ts";
import { noStringContextKeyRule } from "./no-string-context-key.ts";
import { noTimersRule } from "./no-timers.ts";
import { noUpdateCompleteRule } from "./no-update-complete.ts";
import { pairedLifecycleRule } from "./paired-lifecycle.ts";
import { preferContextDecoratorsRule } from "./prefer-context-decorators.ts";
import { preferCreateRefRule } from "./prefer-create-ref.ts";
import { preferDecoratorsRule } from "./prefer-decorators.ts";
import { requireCustomElementRegistrationRule } from "./require-custom-element-registration.ts";
import { requireEventInEventMapRule } from "./require-event-in-event-map.ts";
import { requireTagNameMapRule } from "./require-tag-name-map.ts";
import { selfRegistrationRule } from "./self-registration.ts";

/**
 * Every rule, keyed by rule id, in alphabetical order.
 *
 * A `Map` rather than an object literal: a rule record is a lookup keyed by
 * rule id, so the ids belong in value position.
 */
export const rules: Map<string, LitRule> = new Map([
  ["directive-allowlist", directiveAllowlistRule],
  ["host-constructor", hostConstructorRule],
  ["lifecycle-allowlist", lifecycleAllowlistRule],
  ["no-boolean-property-default-true", noBooleanPropertyDefaultTrueRule],
  ["no-component-disposables", noComponentDisposablesRule],
  ["no-dom-query", noDomQueryRule],
  ["no-event-target-subclass", noEventTargetSubclassRule],
  ["no-fetch-in-component", noFetchInComponentRule],
  ["no-light-dom", noLightDomRule],
  ["no-manual-update", noManualUpdateRule],
  ["no-property-assignment-in-constructor", noPropertyAssignmentInConstructorRule],
  ["no-query-decorators", noQueryDecoratorsRule],
  ["no-string-context-key", noStringContextKeyRule],
  ["no-timers", noTimersRule],
  ["no-update-complete", noUpdateCompleteRule],
  ["paired-lifecycle", pairedLifecycleRule],
  ["prefer-context-decorators", preferContextDecoratorsRule],
  ["prefer-create-ref", preferCreateRefRule],
  ["prefer-decorators", preferDecoratorsRule],
  ["require-custom-element-registration", requireCustomElementRegistrationRule],
  ["require-event-in-event-map", requireEventInEventMapRule],
  ["require-tag-name-map", requireTagNameMapRule],
  ["self-registration", selfRegistrationRule],
]);
