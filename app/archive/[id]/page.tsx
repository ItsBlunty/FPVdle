'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import PuzzleGame from '@/components/game/PuzzleGame';
import { loadState, saveState, saveArchivePlay } from '@/lib/storage';
import type { ClientState } from '@/lib/storage';
import type { DiagnosisDTO, PuzzleTodayDTO } from '@/lib/types';

export default function ArchivePuzzlePage({ params }: { params: { id: string } }) {
  const puzzleId = Number(params.id);

  const [puzzle, setPuzzle] = useState<PuzzleTodayDTO | null>(null);
  const [diagnoses, setDiagnoses] = useState<DiagnosisDTO[]>([]);
  const [clientState, setClientState] = useState<ClientState | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!Number.isInteger(puzzleId)) {
      setError('Invalid puzzle id.');
      return;
    }
    (async () => {
      try {
        const [pRes, dRes] = await Promise.all([
          fetch(`/api/puzzle/${puzzleId}`),
          fetch('/api/diagnoses'),
        ]);
        if (!pRes.ok) {
          if (!cancelled) setError('Puzzle not found.');
          return;
        }
        const p = (await pRes.json()) as PuzzleTodayDTO;
        const d = (await dRes.json()) as DiagnosisDTO[];
        if (cancelled) return;
        setPuzzle(p);
        setDiagnoses(d);
        setClientState(loadState());
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load.');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [puzzleId]);

  const puzzleDateKey = useMemo(
    () => (puzzle ? puzzle.publishDate.slice(0, 10) : ''),
    [puzzle],
  );

  if (error) {
    return (
      <main className="mx-auto max-w-2xl p-6">
        <ArchiveHeader puzzleNumber={null} />
        <div className="rounded-lg border border-border bg-panel p-8 text-center text-muted">
          {error}
        </div>
      </main>
    );
  }

  if (!puzzle || !clientState) {
    return (
      <main className="mx-auto max-w-2xl p-6">
        <ArchiveHeader puzzleNumber={null} />
        <div className="rounded-lg border border-border bg-panel p-8 text-center text-muted">
          Loading puzzle…
        </div>
      </main>
    );
  }

  const initialPlay = clientState.plays[puzzleDateKey];
  const initialPlayMatches =
    initialPlay && initialPlay.puzzleId === puzzle.id ? initialPlay : undefined;

  return (
    <main className="mx-auto max-w-2xl p-4 sm:p-6">
      <ArchiveHeader puzzleNumber={puzzle.number} publishDate={puzzle.publishDate} />

      <PuzzleGame
        puzzle={puzzle}
        diagnoses={diagnoses}
        sessionId={clientState.sessionId}
        initialPlay={initialPlayMatches}
        onPersistInProgress={(play) => {
          setClientState((prev) => {
            const base = prev ?? clientState;
            const next: ClientState = {
              ...base,
              plays: { ...base.plays, [puzzleDateKey]: play },
            };
            saveState(next);
            return next;
          });
        }}
        onPersistCompletion={(play) => {
          // Archive completions don't update streak — playing a 2024 puzzle today
          // shouldn't mess with daily-streak math.
          setClientState((prev) => {
            const base = prev ?? clientState;
            const next = saveArchivePlay(base, puzzleDateKey, play);
            saveState(next);
            return next;
          });
        }}
        showCountdown={false}
      />
    </main>
  );
}

function ArchiveHeader({
  puzzleNumber,
  publishDate,
}: {
  puzzleNumber: number | null;
  publishDate?: string;
}) {
  return (
    <header className="mb-5 flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">
          {puzzleNumber != null ? `Puzzle #${puzzleNumber}` : 'Archive'}
        </h1>
        {publishDate && (
          <div className="text-xs text-muted">
            {new Date(publishDate).toLocaleDateString(undefined, {
              timeZone: 'UTC',
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
          </div>
        )}
      </div>
      <Link
        href="/archive"
        className="rounded-md border border-border bg-panel px-3 py-1.5 text-xs text-gray-200 hover:bg-panelAlt"
      >
        ← Archive
      </Link>
    </header>
  );
}
