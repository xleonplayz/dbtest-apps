import { prisma } from "./db";

export const dynamic = "force-dynamic";

export default async function Page() {
  const [count, last] = await Promise.all([
    prisma.note.count(),
    prisma.note.findMany({ orderBy: { id: "desc" }, take: 5 }),
  ]);
  return (
    <main>
      <h1>dbtest next-prisma</h1>
      <p>{count} notes</p>
      <ul>{last.map((n) => <li key={n.id}>{n.id}: {n.text}</li>)}</ul>
    </main>
  );
}
