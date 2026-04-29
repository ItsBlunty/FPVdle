'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import PuzzleGame from '@/components/game/PuzzleGame';
import { dateKey } from '@/lib/puzzle-time';
import { loadState, saveState, recordCompletion } from '@/lib/storage';
import type { ClientState, PlayRecord } from '@/lib/storage';
import type { DiagnosisDTO, PuzzleTodayDTO } from '@/lib/types';

export default function HomePage() {
  const [puzzle, setPuzzle] = useState<PuzzleTodayDTO | null>(null);
  const [diagnoses, setDiagnoses] = useState<DiagnosisDTO[]>([]);
  const [clientState, setClientState] = useState<ClientState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);

  const todayKey = useMemo(() => dateKey(), []);

  useEffect(() => {
    if (!showHelp) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowHelp(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showHelp]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [pRes, dRes] = await Promise.all([
          fetch('/api/puzzle/today'),
          fetch('/api/diagnoses'),
        ]);
        if (!pRes.ok) {
          if (cancelled) return;
          setError('No puzzle available today.');
          return;
        }
        const p = (await pRes.json()) as PuzzleTodayDTO;
        const d = (await dRes.json()) as DiagnosisDTO[];
        if (cancelled) return;

        const state = loadState();
        setClientState(state);
        setPuzzle(p);
        setDiagnoses(d);
      } catch (e: unknown) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : 'Failed to load puzzle.');
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return (
      <main className="mx-auto max-w-2xl p-6">
        <Header puzzleNumber={null} onHelpClick={() => setShowHelp(true)} />
        <div className="rounded-lg border border-border bg-panel p-8 text-center text-muted">
          {error}
        </div>
        {showHelp && <HelpDialog onClose={() => setShowHelp(false)} />}
      </main>
    );
  }

  if (!puzzle || !clientState) {
    return (
      <main className="mx-auto max-w-2xl p-6">
        <Header puzzleNumber={null} onHelpClick={() => setShowHelp(true)} />
        <div className="rounded-lg border border-border bg-panel p-8 text-center text-muted">
          Loading today's puzzle…
        </div>
        {showHelp && <HelpDialog onClose={() => setShowHelp(false)} />}
      </main>
    );
  }

  const initialPlay = clientState.plays[todayKey];
  const initialPlayMatches = initialPlay && initialPlay.puzzleId === puzzle.id ? initialPlay : undefined;

  return (
    <main className="mx-auto max-w-2xl p-4 sm:p-6">
      <Header puzzleNumber={puzzle.number} onHelpClick={() => setShowHelp(true)} />

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
              plays: { ...base.plays, [todayKey]: play },
            };
            saveState(next);
            return next;
          });
        }}
        onPersistCompletion={(play) => {
          setClientState((prev) => {
            const base = prev ?? clientState;
            const next = recordCompletion(base, todayKey, play);
            saveState(next);
            return next;
          });
        }}
        showCountdown={true}
      />

      {showHelp && <HelpDialog onClose={() => setShowHelp(false)} />}
    </main>
  );
}

function HelpDialog({ onClose }: { onClose: () => void }) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="help-title"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg rounded-lg border border-border bg-panel p-6 text-gray-100 shadow-xl"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 rounded-md px-2 py-1 text-sm text-muted hover:bg-panelAlt hover:text-gray-100"
        >
          ✕
        </button>
        <h2 id="help-title" className="mb-3 pr-8 text-lg font-semibold text-white">
          How Does This Game Work?
        </h2>
        <p className="mb-3 text-sm leading-relaxed">
          Welcome to FPVdle! This is a daily &ldquo;dle&rdquo; game where you have to guess the
          diagnosis based off of increasingly less vague clues. You may not have enough
          information on the first clue to get it for sure, just make your best guess and
          you&rsquo;ll get another clue to help narrow things down!
        </p>
        <p className="text-sm leading-relaxed text-muted">
          Heavily inspired by Doctordle.{' '}
          <a
            href="https://doctordle.org/doctordle/"
            target="_blank"
            rel="noreferrer noopener"
            className="text-blue-400 underline hover:text-blue-300"
          >
            https://doctordle.org/doctordle/
          </a>
        </p>
      </div>
    </div>
  );
}

function Header({
  puzzleNumber,
  onHelpClick,
}: {
  puzzleNumber: number | null;
  onHelpClick: () => void;
}) {
  return (
    <header className="mb-5 grid grid-cols-3 items-center gap-2">
      <div className="justify-self-start">
        <h1 className="text-2xl font-bold tracking-tight text-white">FPVdle</h1>
        {puzzleNumber != null && (
          <div className="text-xs text-muted">Puzzle #{puzzleNumber}</div>
        )}
      </div>
      <button
        type="button"
        onClick={onHelpClick}
        className="justify-self-center rounded-md border border-border bg-panel px-3 py-1.5 text-xs font-medium text-gray-100 hover:bg-panelAlt"
      >
        How Does This Game Work?
      </button>
      <div className="flex justify-self-end gap-2">
        <Link
          href="/archive"
          className="rounded-md border border-border bg-panel px-3 py-1.5 text-xs text-gray-200 hover:bg-panelAlt"
        >
          Archive
        </Link>
        <Link
          href="/stats"
          className="rounded-md border border-border bg-panel px-3 py-1.5 text-xs text-gray-200 hover:bg-panelAlt"
        >
          Stats
        </Link>
      </div>
    </header>
  );
}
