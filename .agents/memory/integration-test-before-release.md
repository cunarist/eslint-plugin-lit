---
description: Before a release, lint bad and good files from separate ESLint and Vite+ consumer projects
---

Unit tests run rules through both `RuleTester`s; that is not the deployment
path. Before release, `vp pack`, `npm pack`, install the tarball into
_separate_ consumer projects, and lint a deliberately-bad file and a known-good
one — once with `vp lint` and `jsPlugins`, once with ESLint 9 and
its `configs`. Use a consumer with real Lit components, including a base class
in another file and one from a package, since the cross-file detection only
shows its worth there. On the Deno version of this plugin that check caught two
bugs 313 unit tests missed.

---
