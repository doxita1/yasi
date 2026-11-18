import { mkdir, cp, readFile, writeFile, rm } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
const root = fileURLToPath(new URL("../", import.meta.url)),
  at = (...parts) => path.join(root, ...parts);
await mkdir(at("dist", "server"), { recursive: true });
await mkdir(at("dist", ".openai"), { recursive: true });
const client = at("dist", "client");
if (path.relative(root, client) !== path.join("dist", "client"))
  throw Error("Unexpected build path");
await rm(client, { recursive: true, force: true });
await cp(at("public"), client, { recursive: true });
await cp(at(".openai", "hosting.json"), at("dist", ".openai", "hosting.json"));
await cp(at("drizzle"), at("dist", ".openai", "drizzle"), { recursive: true });
const api = await readFile(at("server", "api.js"), "utf8");
const main = await readFile(at("server", "worker.js"), "utf8");
await writeFile(
  at("dist", "server", "index.js"),
  api +
    "\n" +
    main.replace(
      /^import\s*\{\s*handleApi\s*\}\s*from\s*['"]\.\/api\.js['"];?\s*/m,
      "",
    ),
);
console.log("Built Sites Worker, client assets and hosted migrations.");
