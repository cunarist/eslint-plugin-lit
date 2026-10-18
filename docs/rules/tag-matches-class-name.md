# lit-robust/tag-matches-class-name

📝 Require a `@customElement` tag to name its class.

💼 This rule is enabled in the 🔤 `naming` [config](https://github.com/cunarist/eslint-plugin-lit-robust#configs-and-rules).

<!-- end auto-generated rule header -->

## Rule Details

This rule reports a `@customElement` tag whose segments, after any leading
prefix, do not PascalCase to the class name.

The tag is what you search for in a template; the class is what you search for
in code. When they disagree, finding the component that renders a given element
becomes guesswork, and a copy-pasted decorator that still carries the old tag
registers the wrong name with no error at all. Requiring the tag to name the
class makes the two searchable from each other.

- A trailing `Element` on the class is stripped before comparing, so
  `cl-path-bar` accepts both `PathBar` and `PathBarElement`. That keeps this
  rule and `require-element-suffix` from contradicting each other.
- The prefix is not known, since the rule takes no options, so any leading
  segments are accepted: `cl-path-bar` matches `PathBar` and `cl-md-slash-menu`
  matches `SlashMenu`. A tag with no prefix at all, `path-bar`, also matches.
- The rule asks whether some suffix of the tag names the class, which means
  `cl-path-bar` also accepts `Bar`. It catches a tag naming a different class,
  not every loose correspondence. `cl-path` and `cl-path-bar-extra` for
  `PathBar` are both rejected.
- Only `@customElement`-registered Lit components with a class name are
  checked.

Examples of **incorrect** code for this rule:

```ts
@customElement("cl-path-bar")
export class Sidebar extends LitElement {}
```

Examples of **correct** code for this rule:

```ts
@customElement("cl-path-bar")
export class PathBar extends LitElement {}
```

## When Not To Use It

If your tags deliberately differ from their class names, for example classes
generated from another naming scheme, turn this rule off.
