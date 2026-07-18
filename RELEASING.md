# Releasing CleanCommit

Releases are published manually from a clean `main` branch. Use one version and one validated VSIX for GitHub, Visual Studio Marketplace, and Open VSX.

## Prerequisites

- `main` is synchronized with `origin/main`.
- Visual Studio Marketplace and Open VSX publishing credentials are available through the macOS Keychain-backed shell helpers.
- Secrets are not stored in this repository, command history, screenshots, or release notes.

## 1. Prepare the release

1. Complete the scoped task and its tests.
2. Update `version` in `package.json`.
3. Add the release entry to `CHANGELOG.md`.
4. Confirm that the working tree contains only the intended changes.

```bash
pnpm run check-types
pnpm run lint
pnpm run compile-tests
CI=true pnpm test
git diff --check
```

## 2. Commit and push

```bash
git add <release-files>
git commit -m "<type>: <description>"
git push origin main
```

## 3. Build and inspect the VSIX

```bash
pnpm run release:package
unzip -t clean-commit-<version>.vsix
shasum -a 256 clean-commit-<version>.vsix
```

Review the file list printed by `vsce`. Install the package locally and complete a smoke test covering provider configuration, generation, regeneration, Settings, and commit creation.

## 4. Tag and create the GitHub Release

Only continue after the smoke test passes.

```bash
git tag -a v<version> -m "CleanCommit <version>"
git push origin v<version>
gh release create v<version> clean-commit-<version>.vsix \
  --title "CleanCommit <version>" \
  --notes-file <release-notes-file>
```

Do not delete or replace an existing tag. Publish a patch version if a release blocker is found after tagging.

## 5. Publish the validated package

The shell helpers load credentials from the macOS Keychain for the duration of each command:

```bash
publish-vscode --packagePath clean-commit-<version>.vsix --no-dependencies
publish-openvsx clean-commit-<version>.vsix
```

The equivalent repository scripts are available when `VSCE_PAT` and `OVSX_PAT` already exist in the current process:

```bash
pnpm run publish:vscode
pnpm run publish:ovsx
```

Never print tokens or include terminal output containing credentials in screenshots. Revoke and rotate a token immediately if it is exposed.

## 6. Verify publication

- Confirm the new version on Visual Studio Marketplace.
- Confirm the new version on Open VSX.
- Confirm the GitHub Release contains the same VSIX.
- Confirm `git status --short` is empty.
