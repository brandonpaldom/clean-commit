# Development

## Requirements

- Node.js 22 or newer
- pnpm 11.14.0
- VS Code 1.90.0 or newer
- Git

## Setup

```bash
pnpm install --frozen-lockfile
```

Use pnpm for dependency and script operations. The lockfile is the source of truth for reproducible installs.

## Run the extension

1. Open the repository in VS Code.
2. Press `F5` and select **Run Extension** if prompted.
3. Open a Git repository in the Extension Development Host.
4. Stage a change and open the CleanCommit activity bar view.

The default build task starts the TypeScript and esbuild watchers before launching the Extension Development Host.

## Quality checks

```bash
pnpm run check-types
pnpm run lint
pnpm run compile
pnpm run compile-tests
CI=true pnpm test
```

The integration suite launches a VS Code Extension Host. Tests that communicate with AI providers should use mocks instead of real API credentials.

## Production build

```bash
pnpm run package
```

To create an installable VSIX, follow [RELEASING.md](RELEASING.md).
