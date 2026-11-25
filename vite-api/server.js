// dbtest vite-api: the built Vite frontend and an API with notes, through the PG* variables
// (no URL), as libpq-style clients read them.
import http from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import pg from "pg";

const configured = ["PGHOST", "PGPORT", "PGDATABASE", "PGUSER", "PGPASSWORD"].every((n) => process.env[n]);
const ssl = /^(require|prefer)$/.test(process.env.PGSSLMODE || "") ? { rejectUnauthorized: false } : undefined;
// pg reads PGHOST and the others itself; PGSSLMODE is given as libpq means it.
delete process.env.PGSSLMODE;
const pool = configured ? new pg.Pool({ ssl, max: 3 }) : null;
let ready = null;
const schema = () =>
  (ready ??= pool.query("CREATE TABLE IF NOT EXISTS notes (id serial PRIMARY KEY, text text NOT NULL, at timestamptz NOT NULL DEFAULT now())"));
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css" };

function send(response, status, body) {
  response.writeHead(status, { "content-type": "application/json" });
  response.end(JSON.stringify(body));
}

http
  .createServer(async (request, response) => {
    const { pathname, searchParams } = new URL(request.url, "http://x");
    if (pathname.startsWith("/api/")) {
      try {
        if (!pool) return send(response, 503, { db: "none", detail: "no PG variables" });
        await schema();
        if (pathname === "/api/health") {
          await pool.query("SELECT 1");
          return send(response, 200, { db: "ok", via: "PG*", app: "vite-api" });
        }
        if (pathname === "/api/notes" && request.method === "POST") {
          const text = (searchParams.get("text") || "hello").slice(0, 200);
          const { rows } = await pool.query("INSERT INTO notes (text) VALUES ($1) RETURNING id, text, at", [text]);
          return send(response, 201, rows[0]);
        }
        if (pathname === "/api/notes") {
          const count = (await pool.query("SELECT count(*)::int AS n FROM notes")).rows[0].n;
          const last = (await pool.query("SELECT id, text, at FROM notes ORDER BY id DESC LIMIT 5")).rows;
          return send(response, 200, { count, last });
        }
        return send(response, 404, { error: "not found" });
      } catch (error) {
        return send(response, 500, { db: "error", detail: String(error.message) });
      }
    }
    const file = normalize(join("dist", pathname === "/" ? "index.html" : pathname));
    try {
      if (!file.startsWith("dist")) throw new Error("outside");
      const body = await readFile(file);
      response.writeHead(200, { "content-type": TYPES[extname(file)] || "application/octet-stream" });
      response.end(body);
    } catch {
      response.writeHead(404);
      response.end("not found");
    }
  })
  .listen(Number(process.env.PORT || 3000));
