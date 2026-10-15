---
name: release
description: Cut a release; bump the version, merge, then publish a GitHub release page, which makes CI publish to npm
---

Ask the user before any step that publishes. Never run `npm publish` yourself
and never push a bare `v*` tag; see [[publish-from-github-release]].

1. On a branch, bump the version in both places that hold it: `version` in
   `package.json` and `meta.version` in `src/index.ts`, which is written out
   rather than imported from JSON. `tests/package-meta.test.ts` fails if the
   two differ. Refresh the lockfile with `npm install --package-lock-only`.
   Run `vp check`, `vp test`, and `vp pack`.
   Commit as `Version X.Y.Z`, then merge through a PR. Before 1.0, a change
   that breaks users (a renamed rule id, a rule that fires on more code) is a
   minor bump.
2. Before the release, run the consumer check in
   [[integration-test-before-release]].
3. Create the release page, which also creates the tag:

   ```sh
   gh release create vX.Y.Z --target main --generate-notes
   ```

   Add `--prerelease` to publish under the `next` dist-tag instead of `latest`.
   The release page is the only place release notes live; edit them there.
   There is no `CHANGELOG.md`, and none should be added.

4. Watch the `Publish` workflow (`gh run watch`). It fails early if the tag and
   `package.json` disagree; fix the version through a PR, delete the release and
   its tag, and start again from step 3.

The very first release needs the one-time npm setup in
[[publish-from-github-release]] before step 3.
