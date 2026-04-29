import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

interface CreateBody {
  id: string;
  name: string;
  category: string;
  aliases: string[];
  description?: string | null;
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export async function GET() {
  const diagnoses = await prisma.diagnosis.findMany({ orderBy: { name: 'asc' } });
  return NextResponse.json(diagnoses);
}

export async function POST(req: NextRequest) {
  let body: CreateBody;
  try {
    body = (await req.json()) as CreateBody;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const id = (body.id?.trim() || slugify(body.name || '')) as string;
  if (!id || !body.name?.trim() || !body.category?.trim()) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }
  try {
    const created = await prisma.diagnosis.create({
      data: {
        id,
        name: body.name.trim(),
        category: body.category.trim(),
        aliases: (body.aliases || []).map((a) => a.trim()).filter(Boolean),
        description: body.description?.trim() || null,
      },
    });
    return NextResponse.json(created, { status: 201 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Create failed';
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
