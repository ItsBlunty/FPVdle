import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest, { params }: { params: { puzzleId: string } }) {
  const puzzleId = Number(params.puzzleId);
  if (!Number.isInteger(puzzleId)) {
    return NextResponse.json({ error: 'Bad puzzle id' }, { status: 400 });
  }

  const plays = await prisma.play.findMany({
    where: { puzzleId },
    select: { cluesUsed: true, solved: true },
  });

  const totalPlays = plays.length;
  const solved = plays.filter((p) => p.solved);
  const solvedCount = solved.length;
  const percentSolved = totalPlays === 0 ? 0 : Math.round((solvedCount / totalPlays) * 100);
  const averageClues =
    solvedCount === 0
      ? null
      : Math.round((solved.reduce((s, p) => s + p.cluesUsed, 0) / solvedCount) * 10) / 10;

  return NextResponse.json({ totalPlays, solvedCount, percentSolved, averageClues });
}
