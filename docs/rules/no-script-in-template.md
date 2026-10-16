# @cunarist/lit/no-script-in-template

📝 Disallow `<script>` elements in templates.

💼 This rule is enabled in the 🧩 `core` [config](https://github.com/cunarist/eslint-plugin-lit#configs-and-rules).

<!-- end auto-generated rule header -->

## Rule Details

Lit parses each template into a `<template>` fragment once, then clones it into
place. A script node created by cloning is already marked "already started" by
the HTML spec, so the browser never executes it. Nothing throws and nothing
warns: the code simply never runs. Importing the module instead runs it.

- Applies to both inline scripts and `src` scripts; neither executes.
- Detected through the parsed tree, so the word "script" appearing in template
  text is not flagged.
- Every `<script>` in a template is reported.
- The diagnostic highlights the start tag, attributes included.

Examples of **incorrect** code for this rule:

```ts
const t = html`<script src="analytics.js"></script>`;
```

Examples of **correct** code for this rule:

```ts
import "./analytics.ts";
```

## When Not To Use It

If a template renders a `<script>` only as inert data, for example a JSON
block another script reads, this rule still reports it.
