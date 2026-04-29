import { NextResponse } from 'next/server';
import { getTodayPuzzle, getPuzzleNumber } from '@/lib/puzzle';

export const dynamic = 'force-dynamic';

export async function GET() {
  const puzzle = await getTodayPuzzle();
  if (!puzzle) {
    return NextResponse.json({ error: 'No puzzle available' }, { status: 404 });
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
