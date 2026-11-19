import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";

import { Command } from "commander";
import JSZip from "jszip";

import { logError, logInfo } from "../utils/log.js";

export const buildCommand = new Command("build");
buildCommand
  .description("Build a Threatmap plugin package")
  .argument(
    "[pluginDir]",
    "Path to the plugin package directory",
    "packages/plugins/tor",
  )
  .action(async (pluginDir: string): Promise<void> => {
    const resolvedPluginDir = path.resolve(process.cwd(), pluginDir);
    const pluginPackageName = `@threatmap/${path.basename(resolvedPluginDir)}`;

    logInfo(`Building plugin package: ${pluginPackageName}`);

    await new Promise<void>((resolve, reject) => {
      const child = spawn("pnpm", ["--filter", pluginPackageName, "build"], {
        stdio: "inherit",
        shell: true,
      });
      child.on("error", reject);
      child.on("exit", (code) => {
        if (code === 0) {
          resolve();
          return;
        }
        reject(new Error(`Build failed with exit code ${code}`));
      });
    });

    const zip = new JSZip();
    zip.file(
      "package.json",
      await fs.readFile(path.join(resolvedPluginDir, "package.json")),
    );
    const addDirectoryToZip = async (
      dirPath: string,
      parentPath: string = "",
    ): Promise<void> => {
      const entries = await fs.readdir(dirPath);
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry);
        const relativePath = parentPath ? path.join(parentPath, entry) : entry;
        const stats = await fs.stat(fullPath);
        if (stats.isDirectory()) {
          await addDirectoryToZip(fullPath, relativePath);
          continue;
        }
        const content = await fs.readFile(fullPath);
        zip.file(relativePath.split(path.sep).join("/"), content);
      }
    };
    await addDirectoryToZip(path.join(resolvedPluginDir, "dist"));

    const content = await zip.generateAsync({ type: "nodebuffer" });
    const outPath = path.join(resolvedPluginDir, "dist", "plugin_package.zip");
    await fs.mkdir(path.dirname(outPath), { recursive: true });
    await fs.writeFile(outPath, content);

    logInfo(`Plugin package built successfully: ${outPath}`);
  });

buildCommand.exitOverride();
