import { prisma } from "../../db";

export const dynamic = "force-dynamic";

export async function GET() {
  const [count, last] = await Promise.all([
    prisma.note.count(),
    prisma.note.findMany({ orderBy: { id: "desc" }, take: 5 }),
  ]);
  return Response.json({ count, last });
}

export async function POST(request) {
  const text = (new URL(request.url).searchParams.get("text") || "hello").slice(0, 200);
  const note = await prisma.note.create({ data: { text } });
  return Response.json(note, { status: 201 });
}
