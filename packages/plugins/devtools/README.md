# @threatmap/devtools

Hot-reloading plugin for faster Threatmap plugin development.

## Features

- Automatically reloads the plugin whenever code changes are detected, making plugin development faster and more efficient.

## How to use

1. Start the watch server for the plugin you are developing:

```sh
pnpm --filter @threatmap/devtools dev -- packages/plugins/<plugin> <port>
```

2. Open the Threatmap instance and navigate to the `Devtools` page.

3. Enter the watch server URL (defaults to `http://localhost:3000`) and connect.

4. The plugin package is installed from the watch server and any code change triggers a rebuild, reinstall and reload.

## Development

- `pnpm --filter @threatmap/devtools build`: build the companion plugin backend.
- `pnpm --filter @threatmap/devtools typecheck`: typecheck the companion plugin.
