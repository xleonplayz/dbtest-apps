// dbtest node-pg: notes in the database Lily attaches, through DATABASE_URL.
const http = require("node:http");
const { Pool } = require("pg");

const url = process.env.DATABASE_URL;
// sslmode=require as libpq reads it: encrypted, the certificate is not verified.
const ssl = url && /sslmode=(require|prefer)/.test(url) ? { rejectUnauthorized: false } : undefined;
const pool = url ? new Pool({ connectionString: url.replace(/[?&]sslmode=[^&]*/, ""), ssl, max: 3 }) : null;
// The same database through the PG* parts alone (no URL), as libpq-style clients read them.
const partsSsl = /^(require|prefer)$/.test(process.env.PGSSLMODE || "") ? { rejectUnauthorized: false } : undefined;
const byParts = ["PGHOST", "PGPORT", "PGDATABASE", "PGUSER", "PGPASSWORD"].every((n) => process.env[n])
  ? new Pool({ host: process.env.PGHOST, port: Number(process.env.PGPORT), database: process.env.PGDATABASE,
      user: process.env.PGUSER, password: process.env.PGPASSWORD, ssl: partsSsl, max: 2 })
  : null;
let ready = null;

function schema() {
  ready ??= pool.query("CREATE TABLE IF NOT EXISTS notes (id serial PRIMARY KEY, text text NOT NULL, at timestamptz NOT NULL DEFAULT now())");
  return ready;
}

function send(response, status, body) {
  response.writeHead(status, { "content-type": "application/json" });
  response.end(JSON.stringify(body));
}

http.createServer(async (request, response) => {
  const { pathname, searchParams } = new URL(request.url, "http://x");
  try {
    if (!pool) return send(response, 503, { db: "none", detail: "no DATABASE_URL" });
    await schema();
    if (pathname === "/api/health" && searchParams.get("via") === "parts") {
      if (!byParts) return send(response, 503, { db: "none", detail: "no PG variables" });
      const { rows } = await byParts.query("SELECT count(*)::int AS n FROM notes");
      return send(response, 200, { db: "ok", via: "PG*", notes: rows[0].n, app: "node-pg" });
    }
    if (pathname === "/api/health") {
      await pool.query("SELECT 1");
      return send(response, 200, { db: "ok", via: "DATABASE_URL", app: "node-pg" });
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
    return send(response, 200, { app: "dbtest-node-pg", routes: ["/api/health", "/api/notes"] });
  } catch (error) {
    // The message, never the connection string.
    return send(response, 500, { db: "error", detail: String(error.message).replace(/postgres(ql)?:\/\/\S+/g, "<url>") });
  }
}).listen(Number(process.env.PORT || 3000));
