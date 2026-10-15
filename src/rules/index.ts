/**
 * Every rule in the plugin, one file each, registered here by rule id. Which
 * configs turn a rule on is decided in `src/index.ts`, not here, because a rule
 * can belong to more than one config.
 */

import type { LitRule } from "#helpers";

import { attributeNamesRule } from "./attribute-names.ts";
import { directiveAllowlistRule } from "./directive-allowlist.ts";
import { eventNameCaseRule } from "./event-name-case.ts";
import { hostConstructorRule } from "./host-constructor.ts";
import { lifecycleAllowlistRule } from "./lifecycle-allowlist.ts";
import { noBooleanPropertyDefaultTrueRule } from "./no-boolean-property-default-true.ts";
import { noCamelcaseAttributeRule } from "./no-camelcase-attribute.ts";
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
import { noUnsafeCssRule } from "./no-unsafe-css.ts";
import { noUnsafeHtmlRule } from "./no-unsafe-html.ts";
import { noUpdateCompleteRule } from "./no-update-complete.ts";
import { noUselessTemplateLiteralsRule } from "./no-useless-template-literals.ts";
import { noValueAttributeRule } from "./no-value-attribute.ts";
import { pairedLifecycleRule } from "./paired-lifecycle.ts";
import { preferContextDecoratorsRule } from "./prefer-context-decorators.ts";
import { preferCreateRefRule } from "./prefer-create-ref.ts";
import { preferDecoratorsRule } from "./prefer-decorators.ts";
import { preferStaticStylesRule } from "./prefer-static-styles.ts";
import { requireAccessorWithDecoratorsRule } from "./require-accessor-with-decorators.ts";
import { requireContextTypeRule } from "./require-context-type.ts";
import { requireControllerSuffixRule } from "./require-controller-suffix.ts";
import { requireCustomElementRegistrationRule } from "./require-custom-element-registration.ts";
import { requireDashedTagRule } from "./require-dashed-tag.ts";
import { requireDirectRegistrationImportRule } from "./require-direct-registration-import.ts";
import { requireDispatchOnThisRule } from "./require-dispatch-on-this.ts";
import { requireElementSuffixRule } from "./require-element-suffix.ts";
import { requireEventInEventMapRule } from "./require-event-in-event-map.ts";
import { requirePropertyTypeRule } from "./require-property-type.ts";
import { requireRepeatKeyRule } from "./require-repeat-key.ts";
import { requireScalarReflectRule } from "./require-scalar-reflect.ts";
import { requireTagNameMapRule } from "./require-tag-name-map.ts";
import { requireTagPrefixRule } from "./require-tag-prefix.ts";
import { selfRegistrationRule } from "./self-registration.ts";
import { simpleTemplateExpressionsRule } from "./simple-template-expressions.ts";
import { svgTemplateForSvgContentRule } from "./svg-template-for-svg-content.ts";
import { tagMatchesClassNameRule } from "./tag-matches-class-name.ts";
import { valueAfterConstraintsRule } from "./value-after-constraints.ts";

/**
 * Every rule, keyed by rule id, in alphabetical order.
 *
 * A `Map` rather than an object literal: a rule record is a lookup keyed by
 * rule id, so the ids belong in value position.
 */
export const rules: Map<string, LitRule> = new Map([
  ["attribute-names", attributeNamesRule],
  ["directive-allowlist", directiveAllowlistRule],
  ["event-name-case", eventNameCaseRule],
  ["host-constructor", hostConstructorRule],
  ["lifecycle-allowlist", lifecycleAllowlistRule],
  ["no-boolean-property-default-true", noBooleanPropertyDefaultTrueRule],
  ["no-camelcase-attribute", noCamelcaseAttributeRule],
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
  ["no-unsafe-css", noUnsafeCssRule],
  ["no-unsafe-html", noUnsafeHtmlRule],
  ["no-update-complete", noUpdateCompleteRule],
  ["no-useless-template-literals", noUselessTemplateLiteralsRule],
  ["no-value-attribute", noValueAttributeRule],
  ["paired-lifecycle", pairedLifecycleRule],
  ["prefer-context-decorators", preferContextDecoratorsRule],
  ["prefer-create-ref", preferCreateRefRule],
  ["prefer-decorators", preferDecoratorsRule],
  ["prefer-static-styles", preferStaticStylesRule],
  ["require-accessor-with-decorators", requireAccessorWithDecoratorsRule],
  ["require-context-type", requireContextTypeRule],
  ["require-controller-suffix", requireControllerSuffixRule],
  ["require-custom-element-registration", requireCustomElementRegistrationRule],
  ["require-dashed-tag", requireDashedTagRule],
  ["require-direct-registration-import", requireDirectRegistrationImportRule],
  ["require-dispatch-on-this", requireDispatchOnThisRule],
  ["require-element-suffix", requireElementSuffixRule],
  ["require-event-in-event-map", requireEventInEventMapRule],
  ["require-property-type", requirePropertyTypeRule],
  ["require-repeat-key", requireRepeatKeyRule],
  ["require-scalar-reflect", requireScalarReflectRule],
  ["require-tag-name-map", requireTagNameMapRule],
  ["require-tag-prefix", requireTagPrefixRule],
  ["self-registration", selfRegistrationRule],
  ["simple-template-expressions", simpleTemplateExpressionsRule],
  ["svg-template-for-svg-content", svgTemplateForSvgContentRule],
  ["tag-matches-class-name", tagMatchesClassNameRule],
  ["value-after-constraints", valueAfterConstraintsRule],
]);
