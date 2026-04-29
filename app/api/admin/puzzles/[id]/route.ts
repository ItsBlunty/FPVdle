import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

interface ClueInput {
  position: number;
  type: 'text' | 'image' | 'video';
  content: string;
  caption?: string | null;
}

interface PatchBody {
  publishDate?: string;
  answerId?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  explanation?: string;
  clues?: ClueInput[];
}

function parseId(raw: string): number | null {
  const n = Number(raw);
  return Number.isInteger(n) ? n : null;
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const id = parseId(params.id);
  if (id == null) return NextResponse.json({ error: 'Bad id' }, { status: 400 });

  const puzzle = await prisma.puzzle.findUnique({
    where: { id },
    include: {
      clues: { orderBy: { position: 'asc' } },
      answer: true,
    },
  });
  if (!puzzle) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(puzzle);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const id = parseId(params.id);
  if (id == null) return NextResponse.json({ error: 'Bad id' }, { status: 400 });

  let body: PatchBody;
  try {
    body = (await req.json()) as PatchBody;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const data: {
    publishDate?: Date;
    answerId?: string;
    difficulty?: string;
    explanation?: string;
  } = {};
  if (body.publishDate) {
    const d = new Date(body.publishDate);
    if (Number.isNaN(d.getTime())) {
      return NextResponse.json({ error: 'Invalid publishDate' }, { status: 400 });
    }
    data.publishDate = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  }
  if (body.answerId) data.answerId = body.answerId;
  if (body.difficulty) {
    if (!['beginner', 'intermediate', 'advanced'].includes(body.difficulty)) {
      return NextResponse.json({ error: 'Invalid difficulty' }, { status: 400 });
    }
    data.difficulty = body.difficulty;
  }
  if (body.explanation !== undefined) data.explanation = body.explanation.trim();

  try {
    const updated = await prisma.$transaction(async (tx) => {
      const p = await tx.puzzle.update({ where: { id }, data });
      if (body.clues) {
        await tx.clue.deleteMany({ where: { puzzleId: id } });
        await tx.clue.createMany({
          data: body.clues
            .slice()
            .sort((a, b) => a.position - b.position)
            .map((c, i) => ({
              puzzleId: id,
              position: i + 1,
              type: c.type,
              content: c.content.trim(),
              caption: c.caption?.trim() || null,
            })),
        });
      }
      return p;
    });
    return NextResponse.json(updated);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Update failed';
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const id = parseId(params.id);
  if (id == null) return NextResponse.json({ error: 'Bad id' }, { status: 400 });
  try {
    await prisma.puzzle.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Delete failed';
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
