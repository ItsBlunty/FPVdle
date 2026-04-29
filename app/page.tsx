'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import ClueCard from '@/components/game/ClueCard';
import DiagnosisAutocomplete from '@/components/game/DiagnosisAutocomplete';
import GuessHistory from '@/components/game/GuessHistory';
import EndScreen from '@/components/game/EndScreen';
import { dateKey } from '@/lib/puzzle-time';
import { loadState, saveState, recordCompletion } from '@/lib/storage';
import type { ClientState, PlayRecord } from '@/lib/storage';
import type { DiagnosisDTO, PuzzleResultDTO, PuzzleTodayDTO, StatsDTO } from '@/lib/types';

type GameStatus = 'loading' | 'playing' | 'won' | 'lost';

export default function HomePage() {
  const [puzzle, setPuzzle] = useState<PuzzleTodayDTO | null>(null);
  const [diagnoses, setDiagnoses] = useState<DiagnosisDTO[]>([]);
  const [clientState, setClientState] = useState<ClientState | null>(null);
  const [status, setStatus] = useState<GameStatus>('loading');
  const [guesses, setGuesses] = useState<string[]>([]);
  const [revealedClues, setRevealedClues] = useState(1);
  const [result, setResult] = useState<PuzzleResultDTO | null>(null);
  const [stats, setStats] = useState<StatsDTO | null>(null);
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

  // Bootstrap: load puzzle, diagnoses, and client state.
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

        const prior = state.plays[todayKey];
        if (prior && prior.puzzleId === p.id && prior.completed) {
          setGuesses(prior.guesses);
          setRevealedClues(prior.cluesRevealed);
          setStatus(prior.solved ? 'won' : 'lost');
          await fetchResultAndStats(p.id, state.sessionId, prior);
        } else if (prior && prior.puzzleId === p.id) {
          setGuesses(prior.guesses);
          setRevealedClues(prior.cluesRevealed || 1);
          setStatus('playing');
        } else {
          setStatus('playing');
        }
      } catch (e: unknown) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : 'Failed to load puzzle.');
      }
    }
    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchResultAndStats(
    puzzleId: number,
    sessionId: string,
    prior: PlayRecord,
  ): Promise<void> {
    try {
      const playRes = await fetch('/api/play', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          puzzleId,
          sessionId,
          cluesUsed: prior.cluesRevealed,
          solved: prior.solved,
        }),
      });
      if (playRes.ok) {
        const r = (await playRes.json()) as PuzzleResultDTO;
        setResult(r);
      }
      const s = await fetch(`/api/stats/${puzzleId}`);
      if (s.ok) setStats((await s.json()) as StatsDTO);
    } catch {
      // Silently ignore stats failures — the end screen still works.
    }
  }

  const handleGuess = useCallback(
    async (diagnosisId: string) => {
      if (!puzzle || !clientState) return;
      if (status !== 'playing') return;
      if (guesses.includes(diagnosisId)) return;

      // Server checks the guess so the answer never reaches the client until
      // the puzzle is completed.
      const checkRes = await fetch('/api/guess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ puzzleId: puzzle.id, diagnosisId }),
      });
      if (!checkRes.ok) return;
      const { correct } = (await checkRes.json()) as { correct: boolean };

      const newGuesses = [...guesses, diagnosisId];

      if (correct) {
        const cluesUsed = revealedClues;
        const play: PlayRecord = {
          puzzleId: puzzle.id,
          guesses: newGuesses,
          solved: true,
          cluesRevealed: cluesUsed,
          completed: true,
        };
        const nextState = recordCompletion(clientState, todayKey, play);
        saveState(nextState);
        setClientState(nextState);
        setGuesses(newGuesses);
        setStatus('won');

        // Submit and fetch result/stats.
        await fetchResultAndStats(puzzle.id, clientState.sessionId, play);
      } else {
        const exhausted = newGuesses.length >= puzzle.totalClues;
        const newReveal = Math.min(puzzle.totalClues, revealedClues + 1);
        if (exhausted) {
          const play: PlayRecord = {
            puzzleId: puzzle.id,
            guesses: newGuesses,
            solved: false,
            cluesRevealed: puzzle.totalClues,
            completed: true,
          };
          const nextState = recordCompletion(clientState, todayKey, play);
          saveState(nextState);
          setClientState(nextState);
          setGuesses(newGuesses);
          setRevealedClues(puzzle.totalClues);
          setStatus('lost');
          await fetchResultAndStats(puzzle.id, clientState.sessionId, play);
        } else {
          const play: PlayRecord = {
            puzzleId: puzzle.id,
            guesses: newGuesses,
            solved: false,
            cluesRevealed: newReveal,
            completed: false,
          };
          const nextState: ClientState = {
            ...clientState,
            plays: { ...clientState.plays, [todayKey]: play },
          };
          saveState(nextState);
          setClientState(nextState);
          setGuesses(newGuesses);
          setRevealedClues(newReveal);
        }
      }
    },
    [puzzle, clientState, status, guesses, revealedClues, todayKey],
  );

  if (error) {
    return (
      <main className="mx-auto max-w-2xl p-6">
        <Header puzzleNumber={null} />
        <HelpButton onClick={() => setShowHelp(true)} />
        <div className="rounded-lg border border-border bg-panel p-8 text-center text-muted">
          {error}
        </div>
        {showHelp && <HelpDialog onClose={() => setShowHelp(false)} />}
      </main>
    );
  }

  if (status === 'loading' || !puzzle) {
    return (
      <main className="mx-auto max-w-2xl p-6">
        <Header puzzleNumber={null} />
        <HelpButton onClick={() => setShowHelp(true)} />
        <div className="rounded-lg border border-border bg-panel p-8 text-center text-muted">
          Loading today's puzzle…
        </div>
        {showHelp && <HelpDialog onClose={() => setShowHelp(false)} />}
      </main>
    );
  }

  const visibleClues = puzzle.clues.slice(0, revealedClues);
  const excludeIds = new Set(guesses);

  return (
    <main className="mx-auto max-w-2xl p-4 sm:p-6">
      <Header puzzleNumber={puzzle.number} />
      <HelpButton onClick={() => setShowHelp(true)} />

      <div className="space-y-3">
        {visibleClues.map((c, i) => (
          <ClueCard key={c.position} clue={c} index={i + 1} total={puzzle.totalClues} />
        ))}
      </div>

      {status === 'playing' ? (
        <div className="mt-5 space-y-3">
          <GuessHistory guesses={guesses} diagnoses={diagnoses} />
          <DiagnosisAutocomplete
            diagnoses={diagnoses}
            excludeIds={excludeIds}
            onSubmit={handleGuess}
          />
          <p className="text-center text-xs text-muted">
            Wrong guess reveals the next clue. {puzzle.totalClues - revealedClues} clue
            {puzzle.totalClues - revealedClues === 1 ? '' : 's'} remaining after this.
          </p>
        </div>
      ) : (
        <div className="mt-5 space-y-3">
          <GuessHistory guesses={guesses} diagnoses={diagnoses} />
          {result && (
            <EndScreen
              solved={status === 'won'}
              cluesUsed={revealedClues}
              totalClues={puzzle.totalClues}
              puzzleNumber={puzzle.number}
              result={result}
              stats={stats}
              guesses={guesses}
            />
          )}
        </div>
      )}

      {showHelp && <HelpDialog onClose={() => setShowHelp(false)} />}
    </main>
  );
}

function HelpButton({ onClick }: { onClick: () => void }) {
  return (
    <div className="mb-5 flex justify-center">
      <button
        type="button"
        onClick={onClick}
        className="rounded-md border border-border bg-panel px-4 py-2 text-sm font-medium text-gray-100 hover:bg-panelAlt"
      >
        How Does This Game Work?
      </button>
    </div>
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

function Header({ puzzleNumber }: { puzzleNumber: number | null }) {
  return (
    <header className="mb-5 flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">FPVdle</h1>
        {puzzleNumber != null && (
          <div className="text-xs text-muted">Puzzle #{puzzleNumber}</div>
        )}
      </div>
      <Link
        href="/stats"
        className="rounded-md border border-border bg-panel px-3 py-1.5 text-xs text-gray-200 hover:bg-panelAlt"
      >
        Stats
      </Link>
    </header>
  );
}
