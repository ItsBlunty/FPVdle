import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

interface ClueInput {
  position: number;
  type: 'text' | 'image' | 'video';
  content: string;
  caption?: string | null;
}

interface CreateBody {
  publishDate: string;
  answerId: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  explanation: string;
  clues: ClueInput[];
}

function validateClues(clues: ClueInput[]): string | null {
  if (!Array.isArray(clues) || clues.length === 0) return 'At least one clue is required';
  for (const c of clues) {
    if (!['text', 'image', 'video'].includes(c.type)) return `Invalid clue type: ${c.type}`;
    if (typeof c.content !== 'string' || !c.content.trim())
      return `Clue ${c.position} is missing content`;
  }
  return null;
}

export async function GET() {
  const puzzles = await prisma.puzzle.findMany({
    orderBy: { publishDate: 'desc' },
    include: {
      answer: { select: { id: true, name: true } },
      _count: { select: { clues: true, plays: true } },
    },
  });
  return NextResponse.json(puzzles);
}

export async function POST(req: NextRequest) {
  let body: CreateBody;
  try {
    body = (await req.json()) as CreateBody;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { publishDate, answerId, difficulty, explanation, clues } = body;
  if (!publishDate || !answerId || !difficulty || !explanation) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }
  if (!['beginner', 'intermediate', 'advanced'].includes(difficulty)) {
    return NextResponse.json({ error: 'Invalid difficulty' }, { status: 400 });
  }
  const cluesErr = validateClues(clues);
  if (cluesErr) return NextResponse.json({ error: cluesErr }, { status: 400 });

  const date = new Date(publishDate);
  if (Number.isNaN(date.getTime())) {
    return NextResponse.json({ error: 'Invalid publishDate' }, { status: 400 });
  }
  // Normalize to UTC midnight.
  const normalized = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );

  const answer = await prisma.diagnosis.findUnique({ where: { id: answerId } });
  if (!answer) return NextResponse.json({ error: 'Answer diagnosis not found' }, { status: 400 });

  try {
    const created = await prisma.puzzle.create({
      data: {
        publishDate: normalized,
        answerId,
        difficulty,
        explanation: explanation.trim(),
        clues: {
          create: clues
            .slice()
            .sort((a, b) => a.position - b.position)
            .map((c, i) => ({
              position: i + 1,
              type: c.type,
              content: c.content.trim(),
              caption: c.caption?.trim() || null,
            })),
        },
      },
      include: { clues: { orderBy: { position: 'asc' } } },
    });
    return NextResponse.json(created, { status: 201 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Create failed';
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
