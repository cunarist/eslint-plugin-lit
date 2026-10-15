# @cunarist/lit/svg-template-for-svg-content

📝 Require SVG-only elements to sit in an `svg` template or an `<svg>` element.

💼 This rule is enabled in the 🧩 `core` [config](https://github.com/cunarist/eslint-plugin-lit#configs-and-rules).

<!-- end auto-generated rule header -->

## Rule Details

Lit builds a template's nodes by parsing it in the HTML namespace. A bare
`<path>` there becomes an _HTML_ element named `path`, not an SVG one. It is
created and inserted, and it renders nothing, with no error or warning. The
`` svg`…` `` tag parses in the SVG namespace and fixes it.

- A full `<svg>…</svg>` inside an `html` template is fine: the parser switches
  namespace at the `<svg>` start tag, so everything below it is created
  correctly.
- Only unwrapped elements are reported: an SVG-only element with no `<svg>`
  ancestor in the same template. Each is reported at its start tag.
- Tag names shared with HTML (`title`, `a`, `style`, `script`, `image`) are
  not in the list; they are legal in an `html` template on their own terms.
- `svg` templates are the fix, so they are skipped entirely.

Examples of **incorrect** code for this rule:

```ts
const t = html`<path d=${this.d}></path>`;
```

Examples of **correct** code for this rule:

```ts
const t = svg`<path d=${this.d}></path>`;

// A complete svg element switches namespace for its children.
const t2 = html`
  <svg>
    <path d=${this.d}></path>
  </svg>
`;
```

## When Not To Use It

Lit always creates an `html` template's elements in the HTML namespace, so a
bare SVG-only element there never renders. There is no case for turning this
rule off.
