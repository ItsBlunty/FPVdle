import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

interface GuessBody {
  puzzleId: number;
  diagnosisId: string;
}

export async function POST(req: NextRequest) {
  let body: GuessBody;
  try {
    body = (await req.json()) as GuessBody;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const { puzzleId, diagnosisId } = body;
  if (typeof puzzleId !== 'number' || typeof diagnosisId !== 'string' || !diagnosisId.trim()) {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  }

  const puzzle = await prisma.puzzle.findUnique({
    where: { id: puzzleId },
    select: { answerId: true },
  });
  if (!puzzle) {
    return NextResponse.json({ error: 'Puzzle not found' }, { status: 404 });
  }

  return NextResponse.json({ correct: puzzle.answerId === diagnosisId });
}
