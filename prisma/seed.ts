import { PrismaClient } from '@prisma/client';
import { promises as fs } from 'fs';
import path from 'path';

const prisma = new PrismaClient();

const MEDIA_DIR = process.env.MEDIA_DIR || './data/media';
const SEED_ASSETS = path.resolve(process.cwd(), 'seed-assets');

async function copyAssetIfMissing(srcRel: string, destRel: string) {
  const src = path.join(SEED_ASSETS, srcRel);
  const dest = path.join(MEDIA_DIR, destRel);
  await fs.mkdir(path.dirname(dest), { recursive: true });
  try {
    await fs.access(dest);
    return;
  } catch {
    /* fall through */
  }
  try {
    await fs.copyFile(src, dest);
    console.log(`  copied ${srcRel} → ${dest}`);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`  warn: could not copy ${srcRel} (${msg}). Placeholder media will be missing.`);
  }
}

async function main() {
  console.log('Seeding diagnoses…');
  const diagnoses = [
    {
      id: 'test-issue-a',
      name: 'Test Issue Alpha',
      category: 'test',
      aliases: ['alpha test', 'issue a'],
      description: 'Placeholder for development testing.',
    },
    {
      id: 'test-issue-b',
      name: 'Test Issue Bravo',
      category: 'test',
      aliases: ['bravo test'],
      description: 'Placeholder for development testing.',
    },
    {
      id: 'test-issue-c',
      name: 'Test Issue Charlie',
      category: 'test',
      aliases: ['charlie test'],
      description: 'Placeholder for development testing.',
    },
  ];
  for (const d of diagnoses) {
    await prisma.diagnosis.upsert({ where: { id: d.id }, update: d, create: d });
  }

  console.log('Copying placeholder media…');
  await copyAssetIfMissing('test-placeholder.png', 'images/test-placeholder.png');
  await copyAssetIfMissing('test-placeholder.mp4', 'videos/test-placeholder.mp4');

  console.log('Seeding test puzzle…');
  const publishDate = new Date('2026-05-01T00:00:00Z');

  const existing = await prisma.puzzle.findUnique({ where: { publishDate } });
  if (existing) {
    await prisma.clue.deleteMany({ where: { puzzleId: existing.id } });
    await prisma.puzzle.delete({ where: { id: existing.id } });
  }

  await prisma.puzzle.create({
    data: {
      publishDate,
      answerId: 'test-issue-b',
      difficulty: 'beginner',
      explanation:
        'This is a placeholder explanation. In a real puzzle, this paragraph explains why the answer was correct and teaches the player something about the underlying issue.',
      clues: {
        create: [
          {
            position: 1,
            type: 'text',
            content: "Placeholder symptom: the quad does the thing it shouldn't be doing.",
          },
          {
            position: 2,
            type: 'image',
            content: '/media/images/test-placeholder.png',
            caption: 'Placeholder image — replace with a real screenshot or photo.',
          },
          {
            position: 3,
            type: 'video',
            content: '/media/videos/test-placeholder.mp4',
            caption: 'Placeholder video — replace with a real flight clip.',
          },
          {
            position: 4,
            type: 'text',
            content: 'Final placeholder clue with the smoking-gun detail.',
          },
        ],
      },
    },
  });

  console.log('Seed complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
