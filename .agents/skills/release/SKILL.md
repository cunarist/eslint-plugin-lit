---
name: release
description: Cut an npm release when the user asks; bump package.json and src/index.ts meta in a PR, then publish a GitHub release page so CI publishes. Never npm publish locally
---

Only when the user asked for a release. Never run `npm publish` yourself,
never push a bare `v*` tag, and never create the release page without the
user's go-ahead: the page is what publishes. See the `publishing-ci-only`
memory.

1. **Bump on a branch.** Set the same `X.Y.Z` in both places:
   - `version` in `package.json`;
   - `meta.version` in `src/index.ts` (written out, not imported).

   Then:

   ```sh
   npm install --package-lock-only
   vp check && vp test && vp pack
   npm run docs -- --check        # plugin repos
   git commit -am "Version X.Y.Z"
   ```

   `tests/package-meta.test.ts` fails if the two versions differ. Before 1.0,
   a change that breaks users (a renamed rule id, a rule that fires on more
   code, a removed config) is a minor bump.

2. **Merge through a PR.** Open it with the usual footer, let the user merge
   (squash). Never merge it yourself.

3. **Consumer check** on the merged `main`: `vp pack`, `npm pack`, install the
   tarball into two scratch projects outside the repo, and lint a known-bad
   and a known-good file, once with `vp lint` + `jsPlugins` and once with
   ESLint 9 + the plugin's configs. Fix anything it finds through a new PR.

4. **Create the release page**, which also creates the tag:

   ```sh
   gh release create vX.Y.Z --target main --generate-notes
   # add --prerelease to publish under the `next` dist-tag
   ```

   Release notes live only here; edit them on the page. There is no
   `CHANGELOG.md` and none is added.

5. **Watch the publish run:** `gh run watch`. It fails early if the tag and
   `package.json` disagree; then fix the version through a PR, delete the
   release and its tag, and start again from step 4.

**First release of a package only:** npm can't attach a trusted publisher to a
package that doesn't exist yet. The user adds a short-lived `NPM_TOKEN` repo
secret, the first release (e.g. `v0.6.0-rc.0`) publishes with it, then the
user configures the trusted publisher for `publish.yml`, deletes the secret,
and disallows tokens. Later releases are tokenless.
