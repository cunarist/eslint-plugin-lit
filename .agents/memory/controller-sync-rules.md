---
description: no-self-sync and no-sync-in-render keep the app repos' file-local detection (name heuristics, no cross-file isLitComponent), ported 1:1 in 0.9.0
---

`no-self-sync` and `no-sync-in-render` (0.9.0, `reactive-controller`) came
from the app repos' `scripts/project-lint.ts` (home `frontend/`, memona
`user_app/`), ported with behavior preserved exactly. Their helpers live in
`src/helpers/controller-sync.ts`, separate from `controllers.ts` because the
detection differs on purpose:

- A reactive controller is a class that `implements ReactiveController`, is
  named `*Controller`, or defines `hostConnected`/`hostDisconnected`, and is
  not a Lit component. `isReactiveController` in `controllers.ts` accepts only
  the `implements` clause.
- A Lit component is detected inside the file only (`LitElement`,
  `ReactiveElement`, `UpdatingElement`, a local alias of `lit`'s `LitElement`,
  or a component declared earlier), not through cross-file `isLitComponent`.
- memona's copy also counted Web Awesome component imports as Lit bases; that
  is app-specific and was dropped.

Moving them to the shared helpers would change behavior; that is an open
question for the user, not a decision.
