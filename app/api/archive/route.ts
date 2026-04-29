import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { utcDayStart } from '@/lib/puzzle-time';

export const dynamic = 'force-dynamic';

export async function GET() {
  const today = utcDayStart();
  const puzzles = await prisma.puzzle.findMany({
    where: { publishDate: { lte: today } },
    orderBy: { publishDate: 'desc' },
    select: {
      id: true,
      publishDate: true,
      difficulty: true,
      _count: { select: { clues: true } },
    },
  });

  const ascByDate = await prisma.puzzle.findMany({
    where: { publishDate: { lte: today } },
    orderBy: { publishDate: 'asc' },
    select: { id: true },
  });
  const numberById = new Map(ascByDate.map((p, i) => [p.id, i + 1]));

  return NextResponse.json(
    puzzles.map((p) => ({
      id: p.id,
      number: numberById.get(p.id) ?? 0,
      publishDate: p.publishDate.toISOString(),
      difficulty: p.difficulty,
      totalClues: p._count.clues,
    })),
  );
}
