---
description: Enum-like string values are UPPER_SNAKE wherever we own the format, JSON wire and stored formats included; external standards are converted at the boundary with explicit functions
---

User decision, 2026-10-19, all repos. Enum-like string values (string
literal unions, status codes, kinds, keys) are UPPER_SNAKE everywhere we own
the format, including JSON sent over the wire or stored on disk.
`explicit-types/upper-snake-string-unions` enforces it where that plugin is
loaded; this repo does not load it yet, so follow the convention by hand.

Formats set by an outside standard (BCP 47 language tags, MIME types, a
third-party API's field values, AST node `type` names, ESLint's `meta.type`
values such as `"problem"`) keep their own spelling at the boundary and are
converted with explicit functions, usually a `switch` in each direction. No
lint override for UPPER_SNAKE.

```ts
type Locale = "EN_US" | "KO_KR";

function localeToLangTag(locale: Locale): string {
  switch (locale) {
    case "EN_US":
      return "en-US";
    case "KO_KR":
      return "ko-KR";
  }
}
```
