---
description: npm publishing happens only in CI, from a published GitHub release whose tag matches the version
---

Never publish by hand. A published GitHub release `vX.Y.Z` triggers
`.github/workflows/publish.yml`, which checks that the tag equals
`v` + `package.json` `version`, runs the whole CI workflow (every Node.js
version in its matrix) as a reusable workflow, then `vp pack` and `npm publish`. A release marked pre-release publishes under the
`next` dist-tag.

Auth is npm trusted publishing (OIDC, `id-token: write`), which also attaches
provenance. npm only lets a trusted publisher be attached to a package that
already exists, so the very first release bootstraps with a short-lived
granular token in the `NPM_TOKEN` repository secret; after it, configure the
trusted publisher for `publish.yml`, delete the secret, and set the package to
disallow tokens. The workflow uses the token only when the secret is set.

Releases follow the other cunarist repos: bump `version` in a commit titled
`Version X.Y.Z`, merge, then create the release page with
`gh release create vX.Y.Z --target main --generate-notes`. Never push a bare
tag. The `release` skill has the steps.
