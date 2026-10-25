# Docker

This folder contains the source of ThreatMap Docker container images.

## Images

| Image | Description | Tags |
|-------|-------------|------|
| `threatcode/threatmap` | Full ThreatMap distribution (Rust toolchain + Node.js + all built packages) | `latest`, `beta`, `vX.Y.Z` |

Images are published to [Docker Hub](https://hub.docker.com/r/threatcode/threatmap).

## Usage

```sh
# Run the ThreatMap CLI
docker run --rm threatcode/threatmap --help

# Run a specific version
docker run --rm threatcode/threatmap:v1.0.0 --help

# Run the convert subcommand
docker run --rm threatcode/threatmap convert base64-encode "hello world"
```

## Build locally

```sh
docker build -f docker/Dockerfile.full -t threatcode/threatmap:local .
```

## Image variants

- `docker/Dockerfile.full` — Multi-stage build image. Installs the Rust toolchain,
  Node.js, and pnpm; builds all packages; produces a runnable runtime image based on
  `node:24-slim`.
- `docker/Dockerfile.slim` — Minimal runtime base (Debian bookworm-slim with
  `ca-certificates` and `tini`). Intended as a foundation for custom runtime layers.

## Release pipeline

Docker images are built and published to Docker Hub automatically via
`.github/workflows/publish-docker.yml`:

- Stable releases (`vX.Y.Z`) are tagged `latest` and `vX.Y.Z`.
- Release candidates (`vX.Y.Z-rc.N`) are tagged `beta`.
- Builds are multi-platform: `linux/amd64` and `linux/arm64`.

Publishing requires `DOCKER_HUB_USERNAME` (repo variable) and
`DOCKER_HUB_PASSWORD` (repo secret).
