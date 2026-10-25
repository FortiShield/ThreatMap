import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import {
  createServer,
  type IncomingMessage,
  type ServerResponse,
} from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { watch as chokidarWatch } from "chokidar";
import JSZip from "jszip";
import { type WebSocket, WebSocketServer } from "ws";

type ConnectedMessage = {
  kind: "connected";
  packageId: string;
  downloadUrl: string;
};

type RebuildMessage = {
  kind: "rebuild";
  downloadUrl: string;
};

type ErrorMessage = {
  kind: "error";
  error: string;
};

const DEFAULT_PORT = 3000;

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
  "..",
  "..",
);
const pluginDirArg = process.argv[2] ?? "packages/plugins/tor";
const port = Number(process.argv[3] ?? DEFAULT_PORT);
const pluginDir = path.resolve(repoRoot, pluginDirArg);
const packageId = path.basename(pluginDir);
const downloadUrl = `http://localhost:${port}/plugin_package.zip`;

const clients = new Set<WebSocket>();
let zipPath: string | undefined;

const notifyRebuild = (): void => {
  const message: RebuildMessage = { kind: "rebuild", downloadUrl };
  clients.forEach((client) => {
    client.send(JSON.stringify(message));
  });
};

const notifyError = (error: string): void => {
  const message: ErrorMessage = { kind: "error", error };
  clients.forEach((client) => {
    client.send(JSON.stringify(message));
  });
};

const build = (): Promise<void> =>
  new Promise<void>((resolve, reject) => {
    const child = spawn(
      "pnpm",
      ["--filter", `@threatmap/${packageId}`, "build"],
      {
        stdio: "inherit",
        shell: true,
      },
    );
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`Build failed with exit code ${code}`));
    });
  });

const addDirectoryToZip = async (
  zip: JSZip,
  dirPath: string,
  parentPath: string = "",
): Promise<void> => {
  const entries = await fs.readdir(dirPath);

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry);
    const relativePath = parentPath ? path.join(parentPath, entry) : entry;
    const stats = await fs.stat(fullPath);

    if (stats.isDirectory()) {
      await addDirectoryToZip(zip, fullPath, relativePath);
      continue;
    }

    const content = await fs.readFile(fullPath);
    zip.file(relativePath.split(path.sep).join("/"), content);
  }
};

const createZip = async (): Promise<void> => {
  const zip = new JSZip();
  zip.file(
    "package.json",
    await fs.readFile(path.join(pluginDir, "package.json")),
  );
  await addDirectoryToZip(zip, path.join(pluginDir, "dist"), "dist");
  const content = await zip.generateAsync({ type: "nodebuffer" });
  await fs.mkdir(path.join(pluginDir, "dist"), { recursive: true });
  zipPath = path.join(pluginDir, "dist", "plugin_package.zip");
  await fs.writeFile(zipPath, content);
};

const startServer = async (): Promise<void> => {
  const server = createServer((req: IncomingMessage, res: ServerResponse) => {
    if (req.url === "/plugin_package.zip") {
      if (zipPath === undefined) {
        res.statusCode = 404;
        res.end("Plugin package not found");
        return;
      }
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/zip");
      res.setHeader(
        "Content-Disposition",
        'attachment; filename="plugin_package.zip"',
      );
      void fs.readFile(zipPath).then((content) => {
        res.end(content);
      });
      return;
    }
    res.statusCode = 404;
    res.end("Not Found");
  });

  const wss = new WebSocketServer({ server });

  wss.on("connection", (ws: WebSocket) => {
    clients.add(ws);
    ws.on("close", () => {
      clients.delete(ws);
    });

    const message: ConnectedMessage = {
      kind: "connected",
      packageId,
      downloadUrl,
    };
    ws.send(JSON.stringify(message));
  });

  await createZip();

  server.listen(port, () => {
    console.log(`Development server running at ${downloadUrl}`);
    console.log(`WebSocket server running at ws://localhost:${port}`);
  });

  const shutdown = (): void => {
    server.close();
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
};

const main = async (): Promise<void> => {
  await startServer();

  const watcher = chokidarWatch(
    [
      path.join(pluginDir, "src"),
      path.join(pluginDir, "package.json"),
      path.join(pluginDir, "tsdown.config.ts"),
      path.join(pluginDir, "tsconfig.json"),
    ],
    {
      ignoreInitial: true,
      ignored: (candidate: string) =>
        candidate.includes(`${path.sep}dist${path.sep}`) ||
        candidate.includes(`${path.sep}node_modules${path.sep}`),
    },
  );

  watcher.on("all", async (event: string, changedPath: string) => {
    console.log(`File ${changedPath} has ${event}`);
    try {
      await build();
      await createZip();
      notifyRebuild();
    } catch (error) {
      notifyError(error instanceof Error ? error.message : "Unknown error");
    }
  });

  watcher.on("error", (error: unknown) => {
    notifyError(error instanceof Error ? error.message : "Unknown error");
  });
};

const run = async (): Promise<void> => {
  await main();
};

void run();
