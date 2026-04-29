'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { loadState } from '@/lib/storage';
import type { ClientState } from '@/lib/storage';

export default function StatsPage() {
  const [state, setState] = useState<ClientState | null>(null);

  useEffect(() => {
    setState(loadState());
  }, []);

  if (!state) {
    return (
      <main className="mx-auto max-w-2xl p-6">
        <Header />
        <div className="rounded-lg border border-border bg-panel p-8 text-center text-muted">
          Loading…
        </div>
      </main>
    );
  }

  const plays = Object.entries(state.plays)
    .map(([date, p]) => ({ date, ...p }))
    .filter((p) => p.completed)
    .sort((a, b) => b.date.localeCompare(a.date));

  const completed = plays.length;
  const wins = plays.filter((p) => p.solved).length;
  const winRate = completed === 0 ? 0 : Math.round((wins / completed) * 100);

  return (
    <main className="mx-auto max-w-2xl p-4 sm:p-6">
      <Header />

      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Played" value={String(completed)} />
        <Stat label="Win %" value={`${winRate}%`} />
        <Stat label="Streak" value={String(state.streak.current)} />
        <Stat label="Max streak" value={String(state.streak.max)} />
      </div>

      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted">History</h2>
      {plays.length === 0 ? (
        <div className="rounded-lg border border-border bg-panel p-6 text-center text-sm text-muted">
          No plays yet. Solve today's puzzle to start a streak.
        </div>
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-panel">
          {plays.map((p) => (
            <li key={p.date} className="flex items-center justify-between p-3 text-sm">
              <div>
                <div className="font-medium text-gray-100">{p.date}</div>
                <div className="text-xs text-muted">
                  Puzzle #{p.puzzleId} · {p.guesses.length} guess{p.guesses.length === 1 ? '' : 'es'}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted">
                  {p.cluesRevealed} clue{p.cluesRevealed === 1 ? '' : 's'}
                </span>
                <span className={p.solved ? 'text-success' : 'text-danger'}>
                  {p.solved ? '✅' : '❌'}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

function Header() {
  return (
    <header className="mb-5 flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Your stats</h1>
        <div className="text-xs text-muted">Tracked locally on this device</div>
      </div>
      <Link
        href="/"
        className="rounded-md border border-border bg-panel px-3 py-1.5 text-xs text-gray-200 hover:bg-panelAlt"
      >
        ← Today's puzzle
      </Link>
    </header>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-panel p-3 text-center">
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-xs text-muted">{label}</div>
    </div>
  );
}
