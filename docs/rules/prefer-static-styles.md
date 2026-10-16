# @cunarist/lit/prefer-static-styles

📝 Enforce `static styles` over `<style>` elements in templates.

💼 This rule is enabled in the 🧩 `core` [config](https://github.com/cunarist/eslint-plugin-lit#configs-and-rules).

<!-- end auto-generated rule header -->

## Rule Details

Styles written in the template are part of the rendered markup, so the browser
re-parses them for every instance of the component instead of once for the
class. A `static styles` member compiles to a single constructable stylesheet
that every instance adopts, which is both faster and the only form Lit can share
across shadow roots.

- The template is parsed as HTML, so the word "style" in text content or a
  `style=` attribute binding does not trigger the rule. Only a real `<style>`
  element does.
- The report highlights the opening `<style>` tag, not the whole element.
- Only Lit's `html` and `svg` tagged templates are checked.

Examples of **incorrect** code for this rule:

```ts
class Card extends LitElement {
  render() {
    return html`
      <div>
        <style>
          p {
            color: red;
          }
        </style>
        <p>hi</p>
      </div>
    `;
  }
}
```

Examples of **correct** code for this rule:

```ts
class Card extends LitElement {
  static styles = css`
    p {
      color: red;
    }
  `;

  render() {
    return html`
      <div>
        <p>hi</p>
      </div>
    `;
  }
}
```

## When Not To Use It

If a component renders without a shadow root, `static styles` does not apply
and a `<style>` element may be the only way to scope its rules.
