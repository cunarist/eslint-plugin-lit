import { spanOf, testRule } from "#testing";

import { preferCreateRefRule } from "./prefer-create-ref.ts";

/** A Lit component with a `render()` body of `body`, as the snippets write it. */
function inRender(body: string): string {
  return `class A extends LitElement { #input; #width; #fallback; render() { ${body} } }`;
}

const highlighted = inRender("return html`<b ${ref((el) => (this.#input = el ?? null))}></b>`;");

const stash = [{ messageId: "stash" }];

testRule("prefer-create-ref", preferCreateRefRule, {
  valid: [
    // allows a callback that does more
    inRender("const r = ref((el) => { this.#input = el; el?.focus(); }); return html`<b>`;"),

    // allows storing a value derived from the element
    inRender("const r = ref((el) => (this.#width = el?.offsetWidth)); return html`<b>`;"),
    inRender("const r = ref((el) => (this.#input = document.activeElement)); return html`<b>`;"),

    // allows a destructured parameter
    inRender("const r = ref(({ el }) => (this.#input = el)); return html`<b>`;"),

    // allows ref of an existing createRef field
    "class A extends LitElement { #input = createRef(); render() { const r = ref(this.#input); return html`<b>`; } }",

    // allows a getter/setter, not matched as a callback
    "class A extends LitElement { #input; set store(el) { this.#input = el; } render() { const r = ref(this.store); return html`<b>`; } }",

    // bails on a reassigned binding
    inRender(
      "let store = (el) => { this.#input = el; }; store = other; const r = ref(store); return html`<b>`;",
    ),

    // bails on a parameter of the same name
    "class A extends LitElement { render(store) { const r = ref(store); return html`<b>`; } }",

    // bails on an imported binding
    `import { store } from "./x.js"; ${inRender("const r = ref(store); return html`<b>`;")}`,

    // ignores a non-ref callee
    inRender("const r = wire((el) => (this.#input = el)); return html`<b>`;"),
  ],
  invalid: [
    // flags an inline stash arrow
    {
      code: inRender("const r = ref((el) => (this.#input = el)); return html`<b>`;"),
      errors: stash,
    },

    // flags ?? null, ?? undefined, as T, and !
    ...["el ?? null", "el ?? undefined", "el as HTMLInputElement", "el!"].map((rhs) => ({
      code: inRender(`const r = ref((el) => (this.#input = ${rhs})); return html\`<b>\`;`),
      errors: stash,
    })),

    // flags a block-body stash arrow
    {
      code: inRender("const r = ref((el) => { this.#input = el ?? null; }); return html`<b>`;"),
      errors: stash,
    },

    // flags a this-referenced arrow field
    {
      code: "class A extends LitElement { #input; #store = (el) => { this.#input = el ?? null; }; render() { const r = ref(this.#store); return html`<b>`; } }",
      errors: stash,
    },

    // flags a this-referenced method
    {
      code: "class A extends LitElement { #input; #store(el) { this.#input = el; } render() { const r = ref(this.#store); return html`<b>`; } }",
      errors: stash,
    },

    // flags a free const arrow in the same file
    {
      code: "let saved; const store = (el) => { saved = el; }; class A extends LitElement { render() { const r = ref(store); return html`<b>`; } }",
      errors: stash,
    },

    // flags a free function declaration
    {
      code: "let saved; function store(el) { saved = el; } class A extends LitElement { render() { const r = ref(store); return html`<b>`; } }",
      errors: stash,
    },

    // flags a local const arrow in render
    {
      code: inRender(
        "const store = (el) => { this.#input = el; }; const r = ref(store); return html`<b>`;",
      ),
      errors: stash,
    },

    // flags a type-narrowing ternary stash
    {
      code: inRender(
        "const r = ref((el) => { this.#input = el instanceof HTMLDivElement ? el : null; }); return html`<b>`;",
      ),
      errors: stash,
    },

    // flags a ?? fallback stash
    {
      code: inRender(
        "const r = ref((el) => (this.#input = el ?? this.#fallback)); return html`<b>`;",
      ),
      errors: stash,
    },

    // catches an inline stash inside the html template, highlighting the call
    {
      code: highlighted,
      errors: [
        { messageId: "stash", ...spanOf(highlighted, "ref((el) => (this.#input = el ?? null))") },
      ],
    },
  ],
});
