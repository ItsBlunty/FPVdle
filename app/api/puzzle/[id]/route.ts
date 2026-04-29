import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getPuzzleNumber, utcDayStart } from '@/lib/puzzle';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: 'Bad puzzle id' }, { status: 400 });
  }

  const puzzle = await prisma.puzzle.findUnique({
    where: { id },
    include: { clues: { orderBy: { position: 'asc' } } },
  });
  if (!puzzle) {
    return NextResponse.json({ error: 'Puzzle not found' }, { status: 404 });
  }

  // Gate future puzzles — never expose a puzzle whose publishDate is in the future.
  if (puzzle.publishDate.getTime() > utcDayStart().getTime()) {
    return NextResponse.json({ error: 'Puzzle not found' }, { status: 404 });
  }

  const number = await getPuzzleNumber(puzzle.id, puzzle.publishDate);

  return NextResponse.json({
    id: puzzle.id,
    number,
    publishDate: puzzle.publishDate.toISOString(),
    difficulty: puzzle.difficulty,
    totalClues: puzzle.clues.length,
    clues: puzzle.clues.map((c) => ({
      position: c.position,
      type: c.type,
      content: c.content,
      caption: c.caption,
    })),
  });
}
