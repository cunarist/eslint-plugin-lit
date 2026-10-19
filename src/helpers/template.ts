/**
 * Parsing `html` tagged templates with parse5, and mapping parse5 source
 * locations back to ranges in the original TypeScript file.
 *
 * Bindings are replaced by a placeholder before parsing so that the markup is
 * well-formed HTML. The placeholder is deliberately ugly and fixed-width per
 * index so offsets stay easy to map back.
 */

import type { SourceLocation } from "@eslint/core";
import type { TSESTree } from "@typescript-eslint/types";
import { type DefaultTreeAdapterMap, parseFragment } from "parse5";

import type { LitSourceCode } from "./rule.ts";

/** An element in a parsed template. */
export type ParsedElement = DefaultTreeAdapterMap["element"];

/** Any node in a parsed template. */
export type ParsedNode = DefaultTreeAdapterMap["node"];

/** The root of a parsed template. */
export type ParsedFragment = DefaultTreeAdapterMap["parentNode"];

/** A `[start, end)` pair of offsets in the source file. */
export type SourceRange = [number, number];

/** Marker substituted for each `${...}` binding. */
export function bindingPlaceholder(index: number): string {
  return `{{__lit_${index}__}}`;
}

/** Matches every binding placeholder in a string. */
const PLACEHOLDER_PATTERN: RegExp = /\{\{__lit_(?<index>\d+)__\}\}/gu;

/** Whether a string contains at least one binding placeholder. */
export function hasPlaceholder(text: string): boolean {
  return placeholderIndices(text).length > 0;
}

/** Indices of the bindings appearing in a string. */
export function placeholderIndices(text: string): number[] {
  return [...text.matchAll(PLACEHOLDER_PATTERN)].map((match) => Number(match[1]));
}

/** A template's markup with bindings replaced, and the way back to the file. */
export interface TemplateSource {
  /** The template text with bindings replaced by placeholders. */
  text: string;
  /** Maps an offset within `text` back to an absolute offset in the source file. */
  toSourceOffset(offset: number): number;
  /** Builds an absolute source range from a parse5 offset pair. */
  toSourceRange(start: number, end: number): SourceRange;
}

/** One stretch of the substituted text and the source it came from. */
interface Segment {
  /** Start offset within the placeholder-substituted text. */
  textStart: number;
  /** Length of this segment in the substituted text. */
  length: number;
  /** Absolute offset in the source file that `textStart` corresponds to. */
  sourceStart: number;
  /** Absolute end offset in the source file. */
  sourceEnd: number;
  /**
   * Placeholder segments have no character-by-character correspondence with
   * the source (`{{__lit_0__}}` is not the same length as `${this.tag}`), so
   * any offset inside one snaps to the whole `${...}` span.
   */
  isPlaceholder: boolean;
}

/**
 * Where a quasi's raw text starts in the file. TypeScript-ESTree spans a
 * `TemplateElement` over its delimiters (`` ` ``, `}`, `${`), while plain
 * ESTree spans only the text; the span's length tells the two apart, so the
 * mapping holds under either host.
 */
function rawStart(quasi: TSESTree.TemplateElement): number {
  const spanLength = quasi.range[1] - quasi.range[0];
  return spanLength === quasi.value.raw.length ? quasi.range[0] : quasi.range[0] + 1;
}

/** A template's substituted text and the segments that map it back. */
interface Substitution {
  text: string;
  segments: Segment[];
}

/** The segments of a template, with the source offset to fall back on outside them. */
interface SegmentMap {
  segments: readonly Segment[];
  /** Where the template literal starts, for an offset no segment covers. */
  fallback: number;
}

/** Joins a template's quasis with binding placeholders, recording each segment. */
function substitute(quasis: readonly TSESTree.TemplateElement[]): Substitution {
  const segments: Segment[] = [];
  let text = "";

  for (const [index, quasi] of quasis.entries()) {
    const start = rawStart(quasi);
    const raw = quasi.value.raw;
    segments.push({
      textStart: text.length,
      length: raw.length,
      sourceStart: start,
      sourceEnd: start + raw.length,
      isPlaceholder: false,
    });
    text += raw;
    const next = quasis[index + 1];
    if (next !== undefined) {
      // The binding runs from this quasi's end, at `${`, to the next one's
      // start, just past `}`, spaces and comments inside it included.
      const placeholder = bindingPlaceholder(index);
      segments.push({
        textStart: text.length,
        length: placeholder.length,
        sourceStart: start + raw.length,
        sourceEnd: rawStart(next),
        isPlaceholder: true,
      });
      text += placeholder;
    }
  }
  return { text, segments };
}

/** The segment covering an offset in the substituted text, or null. */
function segmentAt(segments: readonly Segment[], offset: number): Segment | null {
  return (
    segments.find(
      (segment) => offset >= segment.textStart && offset < segment.textStart + segment.length,
    ) ?? null
  );
}

/** Maps an offset in the substituted text to an absolute source offset. */
function mapOffset({ segments, fallback }: SegmentMap, offset: number): number {
  const segment = segmentAt(segments, offset);
  if (segment === null) {
    return fallback;
  }
  if (segment.isPlaceholder) {
    return segment.sourceStart;
  }
  return segment.sourceStart + (offset - segment.textStart);
}

/** Maps a parse5 offset pair to an absolute source range of at least one character. */
function mapRange(map: SegmentMap, start: number, end: number): SourceRange {
  const from = mapOffset(map, start);
  const last = Math.max(start, end - 1);
  const lastSegment = segmentAt(map.segments, last);
  let to: number | null = null;
  if (lastSegment === null) {
    to = from + 1;
  } else if (lastSegment.isPlaceholder) {
    to = lastSegment.sourceEnd;
  } else {
    to = lastSegment.sourceStart + (last - lastSegment.textStart) + 1;
  }
  return [from, Math.max(from + 1, to)];
}

/**
 * Build the placeholder-substituted text for a template plus a mapping back to
 * source offsets.
 *
 * Only the static quasis map back faithfully; an offset landing inside a
 * placeholder maps to the start of the corresponding `${...}` binding.
 */
export function templateSource(node: TSESTree.TaggedTemplateExpression): TemplateSource {
  const { text, segments } = substitute(node.quasi.quasis);
  const map: SegmentMap = { segments, fallback: node.quasi.range[0] };
  return {
    text,
    toSourceOffset: (offset: number): number => mapOffset(map, offset),
    toSourceRange: (start: number, end: number): SourceRange => mapRange(map, start, end),
  };
}

/** The line and column span of a source range, for `context.report({ loc })`. */
export function rangeLoc(sourceCode: LitSourceCode, range: SourceRange): SourceLocation {
  return {
    start: sourceCode.getLocFromIndex(range[0]),
    end: sourceCode.getLocFromIndex(range[1]),
  };
}

/** Parse a template's substituted text into a parse5 fragment. */
export function parseTemplate(text: string): ParsedFragment {
  return parseFragment(text, { sourceCodeLocationInfo: true });
}

/** Whether a parse5 node is an element. */
export function isElement(node: ParsedNode): node is ParsedElement {
  return "tagName" in node && "attrs" in node;
}

/**
 * Depth-first walk over parse5 element nodes, in **document order**.
 *
 * Order matters for any rule that reports "the second and later occurrence":
 * a stack-based walk visits siblings in reverse, which silently flags the first
 * occurrence and spares the last.
 */
export function walkElements(root: ParsedFragment, visit: (element: ParsedElement) => void): void {
  const visitNode = (node: ParsedNode): void => {
    if (isElement(node)) {
      visit(node);
    }
    if ("childNodes" in node) {
      for (const child of node.childNodes) {
        visitNode(child);
      }
    }
  };
  for (const child of root.childNodes) {
    visitNode(child);
  }
}

/**
 * Where each quasi of a template starts within its placeholder-substituted
 * text, for rules that scan the raw quasis and report through `templateSource`.
 */
export function quasiOffsets(node: TSESTree.TaggedTemplateExpression): number[] {
  const offsets: number[] = [];
  let offset = 0;
  for (const [index, quasi] of node.quasi.quasis.entries()) {
    offsets.push(offset);
    offset += quasi.value.raw.length + bindingPlaceholder(index).length;
  }
  return offsets;
}
