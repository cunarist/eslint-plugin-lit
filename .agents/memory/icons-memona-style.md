---
description: Icons are .ts modules exporting a typed Lit svg template (memona's style), one per file behind an index.ts; never .svg imports as text
---

memona's way of declaring icons is the standard (2026-10-14). An icon is a
`.ts` module that exports a Lit `TemplateResult` holding the inline SVG:

```ts
// src/icons/lock.ts
import { html, type TemplateResult } from "lit";

/** Font Awesome Free's solid `lock`, as its SVG source. */
export const lockIcon: TemplateResult = html`<svg
  xmlns="http://www.w3.org/2000/svg"
  viewBox="0 0 384 512"
>
  <path fill="currentColor" d="M128 96l0 64 ..." />
</svg>`;
```

```ts
// usage
import { lockIcon } from "#icons";
render() { return html`<span class="icon">${lockIcon}</span>`; }
```

- One icon per file, camelCase name with an `Icon` suffix, a doc comment
  saying what it depicts, exported through `src/icons/index.ts`.
- Use `fill="currentColor"` so CSS controls the colour.
- Keep a third-party licence comment that the SVG source carries (Font
  Awesome Free's `<!--! ... -->` notice) inside the template.

**Replaced pattern:** eximium, stockvibe, and memona-home imported Font
Awesome `.svg` files as text in `icons.ts`:

```ts
import lock from "@fortawesome/fontawesome-free/svgs/solid/lock.svg" with { type: "text" }; // no
```

That breaks [[ts-only-files-and-imports]] (non-`.ts` import plus import
attributes) and was converted to memona's style during the frontend
migration. Before writing new icon code in any repo, read how that repo (or
memona) already declares icons and match it.
