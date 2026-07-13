# Commit & Versioning Conventions

## Branching

- `preview` — integration branch. All work is committed or merged here first. Deploys automatically to `preview.luxehairartistry.ca`.
- `production` — release branch. Deploys automatically to the live domain. Updated only by merging `preview` into it — never commit directly to `production`.
- Protect `production` on GitHub: require pull requests, disallow direct pushes, require the build to pass before merging.
- Merge direction is one-way (`preview` → `production`). Hotfixes made directly against `production` must be merged or cherry-picked back into `preview` immediately after.

## Commit Message Format

`<type>(<scope>): <description>`

Scope is optional. Description is a short, present-tense summary.

| Type | Applies to | Version impact |
|---|---|---|
| `feat` | New feature or capability | Minor |
| `fix` | Bug fix | Patch |
| `perf` | Performance improvement | Patch |
| `refactor` | Code change with no behavior change | Patch |
| `docs` | Documentation only | None |
| `style` | Formatting/whitespace, no logic change | None |
| `test` | Test changes | None |
| `build` | Build system, dependencies, config | None |
| `ci` | CI/CD pipeline changes | None |
| `chore` | Routine maintenance, tooling | None |

Breaking change: append `!` after the type/scope (`feat!: ...`), or add a `BREAKING CHANGE:` footer to the commit body. Either bumps the major version.

Examples:

```
feat(artist-page): add booking widget to artist profile
fix(square-webhook): handle missing team member id without throwing
refactor(lib): simplify getSquareServices caching logic
feat(api)!: change revalidate-sanity response shape

BREAKING CHANGE: response is now { revalidated: boolean } instead of a bare boolean.
```

## Enforcement

A `commit-msg` hook (Husky + commitlint, configured in `commitlint.config.js`) rejects commit messages that don't match this format. Bypass: `git commit --no-verify`.

## Versioning

Semantic Versioning (`MAJOR.MINOR.PATCH`) in `package.json`. The version is bumped only at release points, via the process below — not on individual commits.

## Releasing

`npm run release` (powered by [`commit-and-tag-version`](https://github.com/absolute-version/commit-and-tag-version)):

1. Determines the next version from commit types since the last tag.
2. Updates `version` in `package.json` and `package-lock.json`.
3. Updates `CHANGELOG.md`, grouped by commit type (config in `.versionrc.json`).
4. Commits the changes as `chore(release): x.y.z`.
5. Creates an annotated tag `vx.y.z`.

Does not push. Review the commit and changelog, then push manually.

| Command | Effect |
|---|---|
| `npm run release:dry` | Preview the version bump and changelog; no files changed |
| `npm run release` | Auto-detect bump (patch/minor/major) from commit history |
| `npm run release:patch` | Force a patch bump |
| `npm run release:minor` | Force a minor bump |
| `npm run release:major` | Force a major bump |

**Run `npm run release` on `preview`, before opening the pull request into `production`** — not after merging. `production`'s branch protection blocks every direct push, including the release commit itself, so there is no point at which a direct push to `production` will succeed. Run the release step on `preview` once all the changes for that release are in, push `preview`, then open the `preview` → `production` pull request as usual; the version bump, changelog, and commit land in `production` as part of that merge. Push the tag separately, since tags aren't covered by the branch ruleset: `git push origin <tag>`.
