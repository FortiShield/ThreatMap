## 👋 ThreatMap

This is the monorepo for all the JS SDK and related tooling of Threatmap. It contains the following packages:

- `sdk-client`: SDK to interact with a Threatmap Instance as a client
- `sdk-backend`: SDK definition for the Threatmap Plugin Backend
- `sdk-frontend`: SDK definition for the Threatmap Plugin Frontend
- `sdk-workflow`: SDK definition for Threatmap Workflows
- `sdk-shared`: Typing helpers shared between SDKs
- `quickjs-types`: Typing for the QuickJS Engine
- `server-auth`: Client to authenticate with a Threatmap Instance

## Creating a new plugin

Run `pnpm --filter @threatmap/create-plugin build` once, then:

```sh
node tools/create-plugin/dist/index.mjs
```

and follow the prompts. The scaffolder creates a plugin package (by default under `packages/plugins/`) matching the monorepo conventions.

## Release automation

SDK releases are not published from branch pushes. The three product-coupled packages (sdk-backend, sdk-frontend, sdk-workflow) are versioned together on `release/vX.Y.Z` branches. Publishing an immutable `vX.Y.Z[-rc.N]` GitHub Release triggers separate npm and GitHub Packages workflows. Both publishers require the release branch tip to match the tag; wait for both to finish before advancing that branch.

Independently versioned packages are released through `release-independent.yml`. It creates the selected package's `<package>-vX.Y.Z` tag and GitHub Release, then starts separate npm and GitHub Packages publishing jobs. npm uses `NPM_PUBLISH_TOKEN`. GitHub Packages uses `GITHUB_PACKAGES_TOKEN` when configured, otherwise the workflow's `GITHUB_TOKEN` with package write permission.

| GitHub Packages workflow     | Packages                                                  | Manual inputs                                 |
| ---------------------------- | --------------------------------------------------------- | --------------------------------------------- |
| `publish-github.yml`         | One of quickjs-types, sdk-shared, server-auth, sdk-client | `package`, immutable package `ref`, `dry-run` |
| `publish-release-github.yml` | sdk-backend, sdk-frontend, sdk-workflow                   | Immutable `vX.Y.Z[-rc.N]` `ref`, `dry-run`    |

Both GitHub Packages workflows support manual dispatch, defaulting to a dry run. Retry a failed publisher with the same tag; already-published versions are skipped on GitHub Packages. RCs use the `beta` dist-tag and stable releases use `latest`. The registries have separate publication queues, with up to 100 pending runs per queue.
