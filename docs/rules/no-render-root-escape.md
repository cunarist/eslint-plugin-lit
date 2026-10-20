# lit-robust/no-render-root-escape

📝 Disallow a Lit component's render root escaping the component.

💼 This rule is enabled in the 🔗 `dom-ref` [config](https://github.com/cunarist/eslint-plugin-lit-robust#configs-and-rules).

<!-- end auto-generated rule header -->

## Rule Details

This rule reports a Lit component's render root, `this.renderRoot` or
`this.shadowRoot`, leaving the component: passed to a function, returned, or
stored somewhere other than the component itself.

[`no-dom-query`](no-dom-query.md) bans `querySelector` inside a component,
because a selector is a string that duplicates the template and silently
returns `null` once the template changes. Handing the render root to a helper,
`findMatch(this.shadowRoot, ".item")`, runs the same selector lookup one
function away, where `no-dom-query` cannot see it. The `ref` directive carries
the element reference from the template itself, so there is nothing left to
look up.

- Only fires inside a Lit component class body, `ReactiveElement` subclasses
  included.
- An escape is a call or `new` argument, a `return`, `yield`, or arrow body, an
  assignment to anything but a member of `this`, an object property value, or
  an array element. `!`, `as`, `satisfies`, `??`, `||`, `&&`, and a ternary
  branch pass the root on unchanged, so `find(this.renderRoot!)` counts.
- A local alias is followed: `const root = this.renderRoot; find(root);` is
  reported at `root`. Calling methods on the root (`root.append(...)`,
  `this.renderRoot.addEventListener(...)`) and caching it on the component
  (`this.#root = this.renderRoot`) stay inside the component and are allowed.
- Functions imported from Lit's own packages (`lit`, `lit-html`, `lit-element`,
  `@lit/*`) may take the root, so `render(template, this.renderRoot)` and
  `adoptStyles(this.shadowRoot, styles)` are allowed. They render into the
  root; they do not search it by selector.
- Only `this.renderRoot` and `this.shadowRoot` count. Passing `this` itself,
  or an element found through a `ref`, is not this rule's business.

Examples of **incorrect** code for this rule:

```ts
function findMatch(root: ParentNode, selector: string) {
  return root.querySelector(selector);
}

class El extends LitElement {
  highlight() {
    findMatch(this.shadowRoot, ".item")?.classList.add("active");
  }

  get root() {
    return this.renderRoot;
  }
}
```

Examples of **correct** code for this rule:

```ts
class El extends LitElement {
  #item = createRef<HTMLLIElement>();

  highlight() {
    this.#item.value?.classList.add("active");
  }

  render() {
    const itemRef = ref(this.#item);
    return html`<li class="item" ${itemRef}></li>`;
  }
}
```

## When Not To Use It

If a component has to hand its root to code that does not look up elements by
selector, such as a `MutationObserver` or a third-party widget mounted into the
shadow root, the root has to escape. Turn this rule off where that hand-off is
the point.
