import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const diagnoses = await prisma.diagnosis.findMany({
    orderBy: { name: 'asc' },
    select: { id: true, name: true, category: true, aliases: true },
  });
  return NextResponse.json(diagnoses);
}
