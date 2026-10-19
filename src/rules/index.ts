/**
 * Every rule in the plugin, one file each, registered here by rule id. Which
 * configs turn a rule on is decided in `src/plugin/index.ts`, not here, because a rule
 * can belong to more than one config.
 */

import type { LitRule } from "#helpers";

import { attributeNamesRule } from "./attribute-names.ts";
import { attributeValueEntitiesRule } from "./attribute-value-entities.ts";
import { bindingPositionsRule } from "./binding-positions.ts";
import { composedRequiresBubblesRule } from "./composed-requires-bubbles.ts";
import { directiveAllowlistRule } from "./directive-allowlist.ts";
import { eventNameCaseRule } from "./event-name-case.ts";
import { hostConstructorRule } from "./host-constructor.ts";
import { lifecycleAllowlistRule } from "./lifecycle-allowlist.ts";
import { lifecycleSuperRule } from "./lifecycle-super.ts";
import { noArrayMutationWithoutReassignRule } from "./no-array-mutation-without-reassign.ts";
import { noAsyncLifecycleRule } from "./no-async-lifecycle.ts";
import { noAsyncRenderRule } from "./no-async-render.ts";
import { noAttributePropertyBindingConflictRule } from "./no-attribute-property-binding-conflict.ts";
import { noBooleanPropertyDefaultTrueRule } from "./no-boolean-property-default-true.ts";
import { noCamelcaseAttributeRule } from "./no-camelcase-attribute.ts";
import { noClassfieldShadowingRule } from "./no-classfield-shadowing.ts";
import { noComponentDisposablesRule } from "./no-component-disposables.ts";
import { noContextMutationByConsumerRule } from "./no-context-mutation-by-consumer.ts";
import { noDispatchInRenderRule } from "./no-dispatch-in-render.ts";
import { noDomQueryRule } from "./no-dom-query.ts";
import { noDuplicateContextProviderRule } from "./no-duplicate-context-provider.ts";
import { noDuplicatePropertyDeclarationRule } from "./no-duplicate-property-declaration.ts";
import { noDuplicateSlotNamesRule } from "./no-duplicate-slot-names.ts";
import { noDuplicateTagRegistrationRule } from "./no-duplicate-tag-registration.ts";
import { noDuplicateTemplateBindingsRule } from "./no-duplicate-template-bindings.ts";
import { noEventTargetSubclassRule } from "./no-event-target-subclass.ts";
import { noFetchInComponentRule } from "./no-fetch-in-component.ts";
import { noIndexAsRepeatKeyRule } from "./no-index-as-repeat-key.ts";
import { noInlineEventAttributeRule } from "./no-inline-event-attribute.ts";
import { noInnerHtmlAssignmentRule } from "./no-inner-html-assignment.ts";
import { noInvalidEscapeSequencesRule } from "./no-invalid-escape-sequences.ts";
import { noInvalidHtmlRule } from "./no-invalid-html.ts";
import { noJsxAttributeNamesRule } from "./no-jsx-attribute-names.ts";
import { noLegacyImportsRule } from "./no-legacy-imports.ts";
import { noLegacyTemplateSyntaxRule } from "./no-legacy-template-syntax.ts";
import { noLightDomRule } from "./no-light-dom.ts";
import { noManualUpdateRule } from "./no-manual-update.ts";
import { noMultipleDefaultSlotsRule } from "./no-multiple-default-slots.ts";
import { noNativeAttributesRule } from "./no-native-attributes.ts";
import { noPartialPropertyBindingRule } from "./no-partial-property-binding.ts";
import { noPrivatePropertiesRule } from "./no-private-properties.ts";
import { noPropertyAssignmentInConstructorRule } from "./no-property-assignment-in-constructor.ts";
import { noPropertyChangeInUpdatedRule } from "./no-property-change-in-updated.ts";
import { noPropertyChangeUpdateRule } from "./no-property-change-update.ts";
import { noPropertyNamedLikeLifecycleRule } from "./no-property-named-like-lifecycle.ts";
import { noQueryDecoratorsRule } from "./no-query-decorators.ts";
import { noRequestUpdateInUpdatedRule } from "./no-request-update-in-updated.ts";
import { noScriptInTemplateRule } from "./no-script-in-template.ts";
import { noSelfClosingNonVoidRule } from "./no-self-closing-non-void.ts";
import { noStringContextKeyRule } from "./no-string-context-key.ts";
import { noThisAssignInRenderRule } from "./no-this-assign-in-render.ts";
import { noThisInStaticStylesRule } from "./no-this-in-static-styles.ts";
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
export const rules = new Map<string, LitRule>([
  ["attribute-names", attributeNamesRule],
  ["attribute-value-entities", attributeValueEntitiesRule],
  ["binding-positions", bindingPositionsRule],
  ["composed-requires-bubbles", composedRequiresBubblesRule],
  ["directive-allowlist", directiveAllowlistRule],
  ["event-name-case", eventNameCaseRule],
  ["host-constructor", hostConstructorRule],
  ["lifecycle-allowlist", lifecycleAllowlistRule],
  ["lifecycle-super", lifecycleSuperRule],
  ["no-array-mutation-without-reassign", noArrayMutationWithoutReassignRule],
  ["no-async-lifecycle", noAsyncLifecycleRule],
  ["no-async-render", noAsyncRenderRule],
  ["no-attribute-property-binding-conflict", noAttributePropertyBindingConflictRule],
  ["no-boolean-property-default-true", noBooleanPropertyDefaultTrueRule],
  ["no-camelcase-attribute", noCamelcaseAttributeRule],
  ["no-classfield-shadowing", noClassfieldShadowingRule],
  ["no-component-disposables", noComponentDisposablesRule],
  ["no-context-mutation-by-consumer", noContextMutationByConsumerRule],
  ["no-dispatch-in-render", noDispatchInRenderRule],
  ["no-dom-query", noDomQueryRule],
  ["no-duplicate-context-provider", noDuplicateContextProviderRule],
  ["no-duplicate-property-declaration", noDuplicatePropertyDeclarationRule],
  ["no-duplicate-slot-names", noDuplicateSlotNamesRule],
  ["no-duplicate-tag-registration", noDuplicateTagRegistrationRule],
  ["no-duplicate-template-bindings", noDuplicateTemplateBindingsRule],
  ["no-event-target-subclass", noEventTargetSubclassRule],
  ["no-fetch-in-component", noFetchInComponentRule],
  ["no-index-as-repeat-key", noIndexAsRepeatKeyRule],
  ["no-inline-event-attribute", noInlineEventAttributeRule],
  ["no-inner-html-assignment", noInnerHtmlAssignmentRule],
  ["no-invalid-escape-sequences", noInvalidEscapeSequencesRule],
  ["no-invalid-html", noInvalidHtmlRule],
  ["no-jsx-attribute-names", noJsxAttributeNamesRule],
  ["no-legacy-imports", noLegacyImportsRule],
  ["no-legacy-template-syntax", noLegacyTemplateSyntaxRule],
  ["no-light-dom", noLightDomRule],
  ["no-manual-update", noManualUpdateRule],
  ["no-multiple-default-slots", noMultipleDefaultSlotsRule],
  ["no-native-attributes", noNativeAttributesRule],
  ["no-partial-property-binding", noPartialPropertyBindingRule],
  ["no-private-properties", noPrivatePropertiesRule],
  ["no-property-assignment-in-constructor", noPropertyAssignmentInConstructorRule],
  ["no-property-change-in-updated", noPropertyChangeInUpdatedRule],
  ["no-property-change-update", noPropertyChangeUpdateRule],
  ["no-property-named-like-lifecycle", noPropertyNamedLikeLifecycleRule],
  ["no-query-decorators", noQueryDecoratorsRule],
  ["no-request-update-in-updated", noRequestUpdateInUpdatedRule],
  ["no-script-in-template", noScriptInTemplateRule],
  ["no-self-closing-non-void", noSelfClosingNonVoidRule],
  ["no-string-context-key", noStringContextKeyRule],
  ["no-this-assign-in-render", noThisAssignInRenderRule],
  ["no-this-in-static-styles", noThisInStaticStylesRule],
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
