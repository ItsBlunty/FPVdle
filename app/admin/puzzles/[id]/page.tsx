import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import PuzzleForm from '@/components/admin/PuzzleForm';

export const dynamic = 'force-dynamic';

export default async function EditPuzzlePage({ params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (!Number.isInteger(id)) notFound();

  const puzzle = await prisma.puzzle.findUnique({
    where: { id },
    include: { clues: { orderBy: { position: 'asc' } } },
  });
  if (!puzzle) notFound();

  return (
    <div>
      <h1 className="mb-4 text-xl font-bold text-white">Edit puzzle</h1>
      <PuzzleForm
        mode="edit"
        initial={{
          id: puzzle.id,
          publishDate: puzzle.publishDate.toISOString().slice(0, 10),
          answerId: puzzle.answerId,
          difficulty: puzzle.difficulty as 'beginner' | 'intermediate' | 'advanced',
          explanation: puzzle.explanation,
          clues: puzzle.clues.map((c) => ({
            position: c.position,
            type: c.type as 'text' | 'image' | 'video',
            content: c.content,
            caption: c.caption || '',
          })),
        }}
      />
    </div>
  );
}
