'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { loadState } from '@/lib/storage';
import type { ArchiveItemDTO } from '@/lib/types';

interface PlaySummary {
  played: boolean;
  solved: boolean;
  cluesUsed: number;
  totalClues: number;
}

export default function ArchivePage() {
  const [items, setItems] = useState<ArchiveItemDTO[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [plays, setPlays] = useState<Record<number, PlaySummary>>({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/archive');
        if (!res.ok) {
          if (!cancelled) setError('Failed to load archive.');
          return;
        }
        const data = (await res.json()) as ArchiveItemDTO[];
        if (cancelled) return;

        const state = loadState();
        const summary: Record<number, PlaySummary> = {};
        for (const p of data) {
          const key = p.publishDate.slice(0, 10);
          const rec = state.plays[key];
          if (rec && rec.puzzleId === p.id && rec.completed) {
            summary[p.id] = {
              played: true,
              solved: rec.solved,
              cluesUsed: rec.cluesRevealed,
              totalClues: p.totalClues,
            };
          }
        }
        setPlays(summary);
        setItems(data);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load.');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="mx-auto max-w-2xl p-4 sm:p-6">
      <header className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Archive</h1>
          <div className="text-xs text-muted">All past puzzles</div>
        </div>
        <Link
          href="/"
          className="rounded-md border border-border bg-panel px-3 py-1.5 text-xs text-gray-200 hover:bg-panelAlt"
        >
          ← Today
        </Link>
      </header>

      {error && (
        <div className="rounded-lg border border-border bg-panel p-6 text-center text-muted">
          {error}
        </div>
      )}

      {!error && !items && (
        <div className="rounded-lg border border-border bg-panel p-6 text-center text-muted">
          Loading…
        </div>
      )}

      {items && items.length === 0 && (
        <div className="rounded-lg border border-border bg-panel p-6 text-center text-muted">
          No puzzles yet.
        </div>
      )}

      {items && items.length > 0 && (
        <ul className="space-y-2">
          {items.map((p) => {
            const summary = plays[p.id];
            return (
              <li key={p.id}>
                <Link
                  href={`/archive/${p.id}`}
                  className="flex items-center justify-between rounded-md border border-border bg-panel px-4 py-3 hover:bg-panelAlt"
                >
                  <div>
                    <div className="text-sm font-semibold text-white">
                      Puzzle #{p.number}
                    </div>
                    <div className="text-xs text-muted">
                      {formatDate(p.publishDate)} · {p.difficulty}
                    </div>
                  </div>
                  <div className="text-right text-xs">
                    {summary ? (
                      <span
                        className={summary.solved ? 'text-success' : 'text-danger'}
                      >
                        {summary.solved
                          ? `✅ ${summary.cluesUsed}/${summary.totalClues}`
                          : `❌ X/${summary.totalClues}`}
                      </span>
                    ) : (
                      <span className="text-muted">Not played</span>
                    )}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}

function formatDate(iso: string): string {
  // Render the puzzle's UTC publish date (date portion only) consistently —
  // never show a different day depending on the visitor's local timezone.
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    timeZone: 'UTC',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}
