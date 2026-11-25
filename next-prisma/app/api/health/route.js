import { prisma } from "../../db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return Response.json({ db: "ok", via: "DATABASE_URL", app: "next-prisma" });
  } catch (error) {
    return Response.json({ db: "error", detail: String(error.message).split("\n")[0] }, { status: 500 });
  }
}
