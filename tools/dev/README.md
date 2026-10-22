# @threatmap/dev

Development toolkit for building Threatmap plugins.

## Commands

- `threatmap-dev build [pluginDir]`: Build a Threatmap plugin package.
- `threatmap-dev watch [pluginDir] [--port <port>]`: Watch a Threatmap plugin for changes, rebuild, and serve the plugin package.

## How to use

1. Start the watch server for the plugin you are developing:

```sh
pnpm dev:toolkit -- watch packages/plugins/<plugin> --port 3000
```

2. Open the Threatmap instance and connect the Devtools plugin to the watch server.

3. Any code change triggers a rebuild, reinstall and reload of the plugin.
