#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const PLUGINS_DIR = path.resolve(process.cwd(), "packages", "plugins");
const OUTPUT_PATH = path.resolve(process.cwd(), "plugin_packages.json");
const PUBLIC_KEY = process.env.PLUGIN_PUBLIC_KEY;

if (!PUBLIC_KEY) {
  console.error("PLUGIN_PUBLIC_KEY is required");
  process.exit(1);
}

const authorOf = (pkg) => {
  const author = pkg.author;
  if (author && typeof author === "object") {
    return {
      name: author.name ?? "",
      email: author.email ?? "",
      url: author.url ?? "",
    };
  }
  const name = typeof author === "string" ? author : "ThreatCode";
  return { name, email: "", url: "" };
};

const repositoryOf = (pkg) => {
  if (typeof pkg.repository === "string") {
    return pkg.repository;
  }
  return pkg.repository?.url ?? "";
};

const entries = [];

for (const dir of fs.readdirSync(PLUGINS_DIR, { withFileTypes: true })) {
  if (!dir.isDirectory()) {
    continue;
  }
  const pkgPath = path.join(PLUGINS_DIR, dir.name, "package.json");
  if (!fs.existsSync(pkgPath)) {
    continue;
  }
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
  const id = String(pkg.name ?? "").replace(/^@threatmap\//, "");
  entries.push({
    id,
    name: pkg.name,
    version: pkg.version,
    license: pkg.license ?? "MIT",
    description: pkg.description ?? `Specification for the ${id} plugin`,
    author: authorOf(pkg),
    public_key: PUBLIC_KEY,
    repository: repositoryOf(pkg),
  });
}

fs.writeFileSync(OUTPUT_PATH, JSON.stringify(entries, null, 2) + "\n");
console.log(`Generated ${entries.length} plugin entries in ${OUTPUT_PATH}`);
