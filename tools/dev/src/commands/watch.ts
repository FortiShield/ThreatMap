import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import {
  createServer,
  type IncomingMessage,
  type ServerResponse,
} from "node:http";
import path from "node:path";

import { watch as chokidarWatch } from "chokidar";
import { Command } from "commander";
import JSZip from "jszip";
import { type WebSocket, WebSocketServer } from "ws";

import type {
  ConnectedMessage,
  ErrorMessage,
  RebuildMessage,
} from "../types.js";
import { logError, logInfo } from "../utils/log.js";

export const watchCommand = new Command("watch");
watchCommand
  .description("Watch a Threatmap plugin for changes and rebuild")
  .argument(
    "[pluginDir]",
    "Path to the plugin package directory",
    "packages/plugins/tor",
  )
  .option("-p, --port <port>", "Port for the development server", "3000")
  .action(async (pluginDir: string, options: { port: string }) => {
    const resolvedPluginDir = path.resolve(process.cwd(), pluginDir);
    const port = Number(options.port);
    const packageId = path.basename(resolvedPluginDir);
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
        await fs.readFile(path.join(resolvedPluginDir, "package.json")),
      );
      await addDirectoryToZip(
        zip,
        path.join(resolvedPluginDir, "dist"),
        "dist",
      );
      const content = await zip.generateAsync({ type: "nodebuffer" });
      await fs.mkdir(path.join(resolvedPluginDir, "dist"), { recursive: true });
      zipPath = path.join(resolvedPluginDir, "dist", "plugin_package.zip");
      await fs.writeFile(zipPath, content);
    };

    const startServer = async (): Promise<void> => {
      const server = createServer(
        (req: IncomingMessage, res: ServerResponse) => {
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
        },
      );

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
        logInfo(`Development server running at ${downloadUrl}`);
        logInfo(`WebSocket server running at ws://localhost:${port}`);
      });

      const shutdown = (): void => {
        server.close();
      };

      process.on("SIGINT", shutdown);
      process.on("SIGTERM", shutdown);
    };

    await startServer();

    const watcher = chokidarWatch(
      [
        path.join(resolvedPluginDir, "src"),
        path.join(resolvedPluginDir, "package.json"),
        path.join(resolvedPluginDir, "tsdown.config.ts"),
        path.join(resolvedPluginDir, "tsconfig.json"),
      ],
      {
        ignoreInitial: true,
        ignored: (candidate: string) =>
          candidate.includes(`${path.sep}dist${path.sep}`) ||
          candidate.includes(`${path.sep}node_modules${path.sep}`),
      },
    );

    watcher.on("all", async (event: string, changedPath: string) => {
      logInfo(`File ${changedPath} has ${event}`);
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
  });

watchCommand.exitOverride();
