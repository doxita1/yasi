import http from "node:http";
import { DatabaseSync } from "node:sqlite";
import { mkdir, readFile, writeFile, unlink, stat } from "node:fs/promises";
import { createReadStream } from "node:fs";
import { Readable } from "node:stream";
import { randomBytes } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { handleApi } from "../server/api.js";
const root = fileURLToPath(new URL("../", import.meta.url)),
  data = process.env.YASI_PREVIEW_DATA || path.join(root, ".local"),
  pub = path.join(root, "public");
await mkdir(data, { recursive: true });
const sql = new DatabaseSync(path.join(data, "preview.sqlite"));
sql.exec("CREATE TABLE IF NOT EXISTS local_migrations (name TEXT PRIMARY KEY)");
const journal = JSON.parse(
  await readFile(path.join(root, "drizzle/meta/_journal.json"), "utf8"),
);
for (const entry of journal.entries) {
  if (
    !sql.prepare("SELECT 1 FROM local_migrations WHERE name=?").get(entry.tag)
  ) {
    sql.exec("BEGIN");
    try {
      sql.exec(
        await readFile(path.join(root, "drizzle", entry.tag + ".sql"), "utf8"),
      );
      sql.prepare("INSERT INTO local_migrations VALUES (?)").run(entry.tag);
      sql.exec("COMMIT");
    } catch (e) {
      sql.exec("ROLLBACK");
      throw e;
    }
  }
}
const keyFile = path.join(data, "vault-key");
try {
  await writeFile(keyFile, randomBytes(32).toString("base64"), {
    flag: "wx",
    mode: 0o600,
  });
} catch (e) {
  if (e.code !== "EEXIST") throw e;
}
const env = {
  AI_VAULT_KEY: await readFile(keyFile, "utf8"),
  DB: {
    prepare(query) {
      const s = sql.prepare(query);
      return {
        bind: (...a) => ({
          run: () => s.run(...a),
          first: () => s.get(...a) || null,
          all: () => ({ results: s.all(...a) }),
        }),
      };
    },
    batch(statements) {
      sql.exec("BEGIN");
      try {
        const v = statements.map((s) => s.run());
        sql.exec("COMMIT");
        return v;
      } catch (e) {
        sql.exec("ROLLBACK");
        throw e;
      }
    },
  },
  BUCKET: {
    async head(k) {
      return stat(path.join(data, k)).catch(() => null);
    },
    async put(k, b) {
      const f = path.join(data, k);
      await mkdir(path.dirname(f), { recursive: true });
      await writeFile(f, b);
    },
    async get(k) {
      try {
        return { body: await readFile(path.join(data, k)) };
      } catch {
        return null;
      }
    },
    async delete(k) {
      await unlink(path.join(data, k)).catch(() => {});
    },
  },
};
const mime = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".ogg": "audio/ogg",
};
const port = Number(process.env.PORT || 4317);
http
  .createServer(async (req, res) => {
    try {
      if (
        !["127.0.0.1:" + port, "localhost:" + port].includes(req.headers.host)
      ) {
        res.writeHead(403).end();
        return;
      }
      const base = "http://" + req.headers.host,
        url = new URL(req.url, base);
      if (
        url.pathname.startsWith("/__preview/account/") ||
        url.pathname === "/signout-with-chatgpt" ||
        url.pathname === "/signin-with-chatgpt"
      ) {
        const name = url.pathname.endsWith("/b")
          ? "b"
          : url.pathname.startsWith("/signout")
            ? "signedout"
            : "a";
        res
          .writeHead(303, {
            "Set-Cookie":
              "yasi-preview=" + name + "; HttpOnly; SameSite=Strict; Path=/",
            Location: "/",
          })
          .end();
        return;
      }
      if (url.pathname.startsWith("/api/")) {
        const headers = new Headers();
        for (const name of ["content-type", "origin", "sec-fetch-site"])
          if (typeof req.headers[name] === "string")
            headers.set(name, req.headers[name]);
        const cookie =
          ("; " + (req.headers.cookie || "")).match(
            /; yasi-preview=(a|b|signedout)(?:;|$)/,
          )?.[1] || "a";
        if (cookie !== "signedout")
          headers.set("oai-authenticated-user-id", "preview-" + cookie);
        const r = await handleApi(
          new Request(url, {
            method: req.method,
            headers,
            ...(["GET", "HEAD"].includes(req.method)
              ? {}
              : { body: Readable.toWeb(req), duplex: "half" }),
          }),
          env,
        );
        res.writeHead(r.status, Object.fromEntries(r.headers));
        if (r.body) Readable.fromWeb(r.body).pipe(res);
        else res.end();
        return;
      }
      const file = path.resolve(
        pub,
        "." +
          decodeURIComponent(
            url.pathname === "/" ? "/index.html" : url.pathname,
          ),
      );
      if (!file.startsWith(pub + path.sep)) {
        res.writeHead(403).end();
        return;
      }
      const info = await stat(file);
      if (!info.isFile()) {
        res.writeHead(404).end();
        return;
      }
      res.writeHead(200, {
        "Content-Type": mime[path.extname(file)] || "application/octet-stream",
        "Content-Length": info.size,
      });
      if (req.method === "HEAD") res.end();
      else createReadStream(file).pipe(res);
    } catch {
      if (!res.headersSent) res.writeHead(404);
      res.end();
    }
  })
  .listen(port, "127.0.0.1", () =>
    console.log("Local preview http://127.0.0.1:" + port),
  );
