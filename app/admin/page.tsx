import Link from 'next/link';
import { prisma } from '@/lib/db';
import DeletePuzzleButton from '@/components/admin/DeletePuzzleButton';

export const dynamic = 'force-dynamic';

function statusFor(publishDate: Date): { label: string; tone: string } {
  const today = new Date(
    Date.UTC(
      new Date().getUTCFullYear(),
      new Date().getUTCMonth(),
      new Date().getUTCDate(),
    ),
  );
  const t = publishDate.getTime();
  if (t === today.getTime()) return { label: 'Today', tone: 'bg-success/20 text-success' };
  if (t > today.getTime()) return { label: 'Scheduled', tone: 'bg-accent/20 text-accent' };
  return { label: 'Past', tone: 'bg-panelAlt text-muted' };
}

export default async function AdminDashboard() {
  const puzzles = await prisma.puzzle.findMany({
    orderBy: { publishDate: 'desc' },
    include: {
      answer: { select: { id: true, name: true } },
      _count: { select: { clues: true, plays: true } },
    },
  });

  return (
    <div>
      <header className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">Puzzles</h1>
        <div className="flex gap-2">
          <Link
            href="/admin/diagnoses"
            className="rounded-md border border-border bg-panel px-3 py-1.5 text-sm text-gray-200 hover:bg-panelAlt"
          >
            Manage Diagnoses
          </Link>
          <Link
            href="/admin/puzzles/new"
            className="rounded-md bg-accent px-3 py-1.5 text-sm font-semibold text-bg hover:brightness-110"
          >
            + New Puzzle
          </Link>
        </div>
      </header>

      {puzzles.length === 0 ? (
        <div className="rounded-lg border border-border bg-panel p-6 text-center text-sm text-muted">
          No puzzles yet. Create your first one.
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-panel">
          <table className="w-full text-sm">
            <thead className="bg-panelAlt text-left text-xs uppercase tracking-wider text-muted">
              <tr>
                <th className="p-3">Date</th>
                <th className="p-3">Status</th>
                <th className="p-3">Answer</th>
                <th className="p-3">Difficulty</th>
                <th className="p-3">Clues</th>
                <th className="p-3">Plays</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {puzzles.map((p) => {
                const status = statusFor(p.publishDate);
                return (
                  <tr key={p.id}>
                    <td className="p-3 font-mono text-xs text-gray-200">
                      {p.publishDate.toISOString().slice(0, 10)}
                    </td>
                    <td className="p-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs uppercase tracking-wider ${status.tone}`}
                      >
                        {status.label}
                      </span>
                    </td>
                    <td className="p-3 text-gray-100">{p.answer.name}</td>
                    <td className="p-3 capitalize text-muted">{p.difficulty}</td>
                    <td className="p-3 text-muted">{p._count.clues}</td>
                    <td className="p-3 text-muted">{p._count.plays}</td>
                    <td className="p-3 text-right">
                      <Link
                        href={`/admin/puzzles/${p.id}`}
                        className="mr-2 text-xs text-accent hover:underline"
                      >
                        Edit
                      </Link>
                      <DeletePuzzleButton id={p.id} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
