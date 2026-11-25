# dbtest-apps

Lily's test suite for managed databases (lane DBCREATE, 25.11.2026). Each folder is one app; each
one stores notes in the database Lily attaches and reads them back. No secret is in this
repository: the apps get their connection from Lily at deploy time.

| Folder | Stack | Reads |
|---|---|---|
| `node-pg` | Node `http` + `pg` | `DATABASE_URL`; `/api/health?via=parts` the `PG*` parts alone |
| `vite-api` | Vite frontend (Lily serves it as a static site; its `server.js` is for local use) | – |
| `next-prisma` | Next.js 14 + Prisma 5 | `DATABASE_URL`, `DIRECT_URL` (migrations) |

Every app answers `GET /api/notes` (count and last five), `POST /api/notes?text=…` (adds one) and
`GET /api/health` (`{"db": "ok", "via": "..."}`). TLS follows `sslmode=require` as libpq does:
encrypted, the certificate is not verified.
