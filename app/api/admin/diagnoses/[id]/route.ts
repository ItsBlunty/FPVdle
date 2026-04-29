import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

interface UpdateBody {
  name?: string;
  category?: string;
  aliases?: string[];
  description?: string | null;
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const d = await prisma.diagnosis.findUnique({ where: { id: params.id } });
  if (!d) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(d);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  let body: UpdateBody;
  try {
    body = (await req.json()) as UpdateBody;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  try {
    const updated = await prisma.diagnosis.update({
      where: { id: params.id },
      data: {
        name: body.name?.trim(),
        category: body.category?.trim(),
        aliases: body.aliases?.map((a) => a.trim()).filter(Boolean),
        description: body.description === undefined ? undefined : body.description?.trim() || null,
      },
    });
    return NextResponse.json(updated);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Update failed';
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  // Block delete if any puzzle currently uses it.
  const inUse = await prisma.puzzle.count({ where: { answerId: params.id } });
  if (inUse > 0) {
    return NextResponse.json(
      { error: `Cannot delete: used as the answer for ${inUse} puzzle(s).` },
      { status: 409 },
    );
  }
  try {
    await prisma.diagnosis.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Delete failed';
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
