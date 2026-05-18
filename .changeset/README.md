# Changesets

Use `pnpm changeset` in feature branches to describe user-facing package changes.

When changes land on `main`, the release workflow opens or updates a release PR.
Merging that release PR publishes changed packages to npm and creates GitHub
Releases from the generated changelogs.
