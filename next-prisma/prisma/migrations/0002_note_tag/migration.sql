-- 0002: a column and an index, so a redeploy runs real DDL through prisma migrate deploy.
ALTER TABLE "Note" ADD COLUMN "tag" TEXT;

CREATE INDEX "Note_at_idx" ON "Note"("at");
