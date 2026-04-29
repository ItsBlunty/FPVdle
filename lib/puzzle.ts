import { prisma } from './db';
import { utcDayStart } from './puzzle-time';

export { utcDayStart, dateKey, msUntilNextUtcMidnight } from './puzzle-time';

/**
 * Returns "today's" puzzle by UTC publishDate. If no puzzle is published for
 * today, returns the most recent past puzzle. Returns null if there are none.
 */
export async function getTodayPuzzle() {
  const today = utcDayStart();

  const exact = await prisma.puzzle.findUnique({
    where: { publishDate: today },
    include: { clues: { orderBy: { position: 'asc' } }, answer: true },
  });
  if (exact) return exact;

  return prisma.puzzle.findFirst({
    where: { publishDate: { lte: today } },
    orderBy: { publishDate: 'desc' },
    include: { clues: { orderBy: { position: 'asc' } }, answer: true },
  });
}

/**
 * The puzzle "number" displayed in the UI. We use a stable epoch (the first
 * puzzle's publishDate, or a fallback) so #1 is the first puzzle, #2 is the
 * second, etc. Computed by counting puzzles with publishDate <= this puzzle's.
 */
export async function getPuzzleNumber(puzzleId: number, publishDate: Date): Promise<number> {
  const count = await prisma.puzzle.count({
    where: { publishDate: { lte: publishDate } },
  });
  // Tie-breaker: count is already inclusive, so this is the puzzle's ordinal.
  return count;
}
