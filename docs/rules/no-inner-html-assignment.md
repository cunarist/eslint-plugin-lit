# @cunarist/lit/no-inner-html-assignment

📝 Disallow assigning to `innerHTML` or `outerHTML`.

💼 This rule is enabled in the 🧩 `core` [config](https://github.com/cunarist/eslint-plugin-lit#configs-and-rules).

<!-- end auto-generated rule header -->

## Rule Details

Assigning to `innerHTML` or `outerHTML` parses whatever string it is given as
markup. It is the canonical XSS sink: any interpolated value that was not
escaped becomes live HTML, and an `onerror` attribute on an injected `<img>` is
enough to run script.

Inside a Lit component it is also a correctness bug, security aside. Lit tracks
the DOM it created through marker comment nodes. Replacing a subtree out from
under it means the next render either erases the injected markup or fails
looking for a marker that is no longer in the tree. Rendering the content from a
template keeps Lit in charge of the DOM.

- Reading `innerHTML` is fine. Only assignment is reported, compound assignment
  such as `+=` included.
- The receiver does not matter: `this`, `this.renderRoot`, and a plain `el`
  are all reported. A Lit-managed node cannot be told from an unmanaged one
  statically, and the XSS half of the argument applies either way.
- A computed access with a string key, `el["innerHTML"] = …`, is caught too.
- `insertAdjacentHTML` and `document.write` are the same class of sink but are
  not covered.

Examples of **incorrect** code for this rule:

```ts
this.innerHTML = markup;
this.renderRoot.innerHTML = "";
el.outerHTML = markup;
```

Examples of **correct** code for this rule:

```ts
this.textContent = text;
```

## When Not To Use It

If you deliberately manage a subtree outside Lit and sanitize every string you
assign, this rule reports that code anyway. Turn it off for those files.
