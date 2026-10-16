---
description: Work on a branch, plain imperative commits without AI trailers, one PR with the Claude Code footer, review until approved, never merge yourself; squash only
---

## Branches and commits

- Never push to `main`. Every change goes through a branch and a PR, even a
  one-line fix.
- Commit messages are plain imperative sentences ("Port the import-check
  rules to an ESLint plugin"). No conventional-commit prefixes, no AI
  trailers (`Co-Authored-By: Claude`, "Generated with ..."), no emoji.
- A version bump is its own commit titled `Version X.Y.Z` ([[publishing-ci-only]]).
- When several agents share a branch, each works in its own `git worktree`,
  runs `git pull --rebase` before pushing, and retries a rejected push after
  rebasing. Remove the worktree and temp branch afterwards.
- `vp check`, `vp test`, and the build pass locally before every push.

## Pull requests

- One PR per repo for a migration, everything included (size-rule refactors
  too).
- The body covers: summary, what changed, deviations and risks, verification
  done, and open questions. It ends with exactly this line:

  ```
  🤖 Generated with [Claude Code](https://claude.com/claude-code)
  ```

- Then run the review cycle (skill `review-cycle`): on Capsulizers Gitea repos
  that have `.gitea/workflows/agents.yml`, comment `@bot` and address the `bot`
  account's review; elsewhere, a subagent reviews the diff and posts the
  review as a PR comment. Repeat until fully approved, then ask the user to
  review.

## Merging

- **Never merge on your own.** The user merges, unless they explicitly allow
  it for one specific PR.
- GitHub repos are squash-merge only, so a PR lands as one commit titled after
  the PR.
- Also never, without the user: publish, archive a repo, or delete a branch
  the user may still use.

## Hosts

- **cunarist** and **temeddix**: GitHub only, CI in `.github/workflows`, use
  the `gh` CLI.
- **Capsulizers**: Gitea at git.capsulizers.com (Gitea 1.26), CI in
  `.gitea/workflows`, PRs through the Gitea API. Push and open PRs as the
  user's own account (credentials in the user's environment; source them in a
  subshell and never print them); `bot` is a separate review account. The
  org's codified rules live in the `commons/code-rules` README.
