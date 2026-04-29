'use client';

import { useEffect, useState } from 'react';
import type { PuzzleResultDTO, StatsDTO } from '@/lib/types';
import { msUntilNextUtcMidnight } from '@/lib/puzzle-time';

interface Props {
  solved: boolean;
  cluesUsed: number;
  totalClues: number;
  puzzleNumber: number;
  result: PuzzleResultDTO;
  stats: StatsDTO | null;
  guesses: string[];
}

function buildShareText({
  puzzleNumber,
  solved,
  cluesUsed,
  totalClues,
}: {
  puzzleNumber: number;
  solved: boolean;
  cluesUsed: number;
  totalClues: number;
}) {
  const head = solved
    ? `FPVdle #${puzzleNumber} — ${cluesUsed}/${totalClues} ✅`
    : `FPVdle #${puzzleNumber} — X/${totalClues} ❌`;
  const wrongCount = solved ? cluesUsed - 1 : totalClues;
  const correctCount = solved ? 1 : 0;
  const squares = '🟥'.repeat(wrongCount) + '🟩'.repeat(correctCount);
  return `${head}\n${squares}`;
}

function difficultyClass(d: string) {
  switch (d) {
    case 'beginner':
      return 'bg-success/20 text-success border-success/40';
    case 'advanced':
      return 'bg-danger/20 text-danger border-danger/40';
    default:
      return 'bg-accent/20 text-accent border-accent/40';
  }
}

function useCountdown() {
  const [ms, setMs] = useState<number>(() => msUntilNextUtcMidnight());
  useEffect(() => {
    const id = setInterval(() => setMs(msUntilNextUtcMidnight()), 1000);
    return () => clearInterval(id);
  }, []);
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${h}h ${m}m ${s}s`;
}

export default function EndScreen({
  solved,
  cluesUsed,
  totalClues,
  puzzleNumber,
  result,
  stats,
  guesses,
}: Props) {
  const [copied, setCopied] = useState(false);
  const countdown = useCountdown();

  async function copyShare() {
    const text = buildShareText({ puzzleNumber, solved, cluesUsed, totalClues });
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  }

  return (
    <div className="rounded-lg border border-border bg-panel p-6 text-center">
      <div className="mb-3 text-5xl">{solved ? '✅' : '❌'}</div>
      <div className="mb-1 text-sm text-muted">{solved ? 'Solved' : 'Better luck tomorrow'}</div>
      <h2 className="mb-2 text-2xl font-bold text-white">{result.answerName}</h2>
      <span
        className={`mb-4 inline-block rounded-full border px-2 py-0.5 text-xs uppercase tracking-wider ${difficultyClass(
          result.difficulty,
        )}`}
      >
        {result.difficulty}
      </span>

      <p className="mx-auto mb-4 max-w-xl text-left text-sm leading-relaxed text-gray-300">
        {result.explanation}
      </p>

      <div className="mx-auto mb-4 grid max-w-md grid-cols-2 gap-3 text-sm">
        <div className="rounded border border-border bg-panelAlt p-3">
          <div className="text-2xl font-bold text-white">
            {stats ? `${stats.percentSolved}%` : '—'}
          </div>
          <div className="text-xs text-muted">solved</div>
        </div>
        <div className="rounded border border-border bg-panelAlt p-3">
          <div className="text-2xl font-bold text-white">
            {stats?.averageClues != null ? `${stats.averageClues}` : '—'}
            {stats?.averageClues != null && (
              <span className="text-base text-muted"> / {totalClues}</span>
            )}
          </div>
          <div className="text-xs text-muted">avg clues used</div>
        </div>
      </div>

      <div className="mb-4 text-sm text-muted">
        You used <strong className="text-gray-100">{cluesUsed}</strong> /{' '}
        <strong className="text-gray-100">{totalClues}</strong> clues, with {guesses.length}{' '}
        guess{guesses.length === 1 ? '' : 'es'}.
      </div>

      <button
        onClick={copyShare}
        className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-bg hover:brightness-110"
      >
        {copied ? 'Copied!' : 'Copy Result'}
      </button>

      <div className="mt-6 text-xs text-muted">Next puzzle in {countdown}</div>
    </div>
  );
}
