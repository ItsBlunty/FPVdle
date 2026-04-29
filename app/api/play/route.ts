import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

interface PlayBody {
  puzzleId: number;
  sessionId: string;
  cluesUsed: number;
  solved: boolean;
}

export async function POST(req: NextRequest) {
  let body: PlayBody;
  try {
    body = (await req.json()) as PlayBody;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { puzzleId, sessionId, cluesUsed, solved } = body;
  if (
    typeof puzzleId !== 'number' ||
    typeof sessionId !== 'string' ||
    typeof cluesUsed !== 'number' ||
    typeof solved !== 'boolean' ||
    !sessionId.trim()
  ) {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  }

  // Fetch puzzle to also include the answer in the response.
  const puzzle = await prisma.puzzle.findUnique({
    where: { id: puzzleId },
    include: { answer: true },
  });
  if (!puzzle) {
    return NextResponse.json({ error: 'Puzzle not found' }, { status: 404 });
  }

  // upsert: one play per session per puzzle.
  await prisma.play.upsert({
    where: { puzzleId_sessionId: { puzzleId, sessionId } },
    update: { cluesUsed, solved },
    create: { puzzleId, sessionId, cluesUsed, solved },
  });

  return NextResponse.json({
    answerId: puzzle.answerId,
    answerName: puzzle.answer.name,
    explanation: puzzle.explanation,
    difficulty: puzzle.difficulty,
  });
}
