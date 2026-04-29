'use client';

import { useCallback, useEffect, useState } from 'react';
import ClueCard from '@/components/game/ClueCard';
import DiagnosisAutocomplete from '@/components/game/DiagnosisAutocomplete';
import GuessHistory from '@/components/game/GuessHistory';
import EndScreen from '@/components/game/EndScreen';
import type { PlayRecord } from '@/lib/storage';
import type {
  DiagnosisDTO,
  PuzzleResultDTO,
  PuzzleTodayDTO,
  StatsDTO,
} from '@/lib/types';

type GameStatus = 'playing' | 'won' | 'lost';

interface Props {
  puzzle: PuzzleTodayDTO;
  diagnoses: DiagnosisDTO[];
  sessionId: string;
  initialPlay?: PlayRecord;
  /** Called whenever in-progress state should be persisted (not in practice). */
  onPersistInProgress: (play: PlayRecord) => void;
  /** Called once on first completion of this puzzle (not in practice). */
  onPersistCompletion: (play: PlayRecord) => void;
  /** Toggles whether the share text shows next-puzzle countdown (daily) or not. */
  showCountdown?: boolean;
}

export default function PuzzleGame({
  puzzle,
  diagnoses,
  sessionId,
  initialPlay,
  onPersistInProgress,
  onPersistCompletion,
  showCountdown = true,
}: Props) {
  const wasCompleted = initialPlay?.completed ?? false;

  const [guesses, setGuesses] = useState<string[]>(initialPlay?.guesses ?? []);
  const [revealedClues, setRevealedClues] = useState<number>(
    initialPlay && initialPlay.cluesRevealed > 0 ? initialPlay.cluesRevealed : 1,
  );
  const [status, setStatus] = useState<GameStatus>(() => {
    if (!wasCompleted) return 'playing';
    return initialPlay!.solved ? 'won' : 'lost';
  });
  const [result, setResult] = useState<PuzzleResultDTO | null>(null);
  const [stats, setStats] = useState<StatsDTO | null>(null);
  const [practice, setPractice] = useState(false);

  // Bootstrap: if there's a prior completion, fetch the answer + stats so the
  // end screen can render. Idempotent: /api/play upserts so repeated calls are
  // safe.
  useEffect(() => {
    if (!wasCompleted || !initialPlay) return;
    void fetchResultAndStats(puzzle.id, sessionId, initialPlay).then(({ res, st }) => {
      if (res) setResult(res);
      if (st) setStats(st);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGuess = useCallback(
    async (diagnosisId: string) => {
      if (status !== 'playing') return;
      if (guesses.includes(diagnosisId)) return;

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
        setGuesses(newGuesses);
        setStatus('won');

        if (!practice) {
          onPersistCompletion(play);
          const { res, st } = await fetchResultAndStats(puzzle.id, sessionId, play);
          if (res) setResult(res);
          if (st) setStats(st);
        } else {
          // Practice mode: don't log to /api/play (keeps stats clean) but do
          // refresh /api/stats so the end-screen percentages stay current.
          const st = await fetchStats(puzzle.id);
          if (st) setStats(st);
        }
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
          setGuesses(newGuesses);
          setRevealedClues(puzzle.totalClues);
          setStatus('lost');

          if (!practice) {
            onPersistCompletion(play);
            const { res, st } = await fetchResultAndStats(puzzle.id, sessionId, play);
            if (res) setResult(res);
            if (st) setStats(st);
          } else {
            const st = await fetchStats(puzzle.id);
            if (st) setStats(st);
          }
        } else {
          const play: PlayRecord = {
            puzzleId: puzzle.id,
            guesses: newGuesses,
            solved: false,
            cluesRevealed: newReveal,
            completed: false,
          };
          setGuesses(newGuesses);
          setRevealedClues(newReveal);
          if (!practice) onPersistInProgress(play);
        }
      }
    },
    [
      puzzle,
      status,
      guesses,
      revealedClues,
      practice,
      sessionId,
      onPersistInProgress,
      onPersistCompletion,
    ],
  );

  const resetForFun = useCallback(() => {
    setPractice(true);
    setGuesses([]);
    setRevealedClues(1);
    setStatus('playing');
    // Keep `result` and `stats` — they don't change between attempts.
  }, []);

  const visibleClues = puzzle.clues.slice(0, revealedClues);
  const excludeIds = new Set(guesses);

  return (
    <>
      <div className="space-y-3">
        {visibleClues.map((c, i) => (
          <ClueCard key={c.position} clue={c} index={i + 1} total={puzzle.totalClues} />
        ))}
      </div>

      {status === 'playing' ? (
        <div className="mt-5 space-y-3">
          {practice && (
            <div className="rounded-md border border-accent/40 bg-accent/10 px-3 py-2 text-center text-xs text-accent">
              Practice mode — this attempt won&rsquo;t change your saved record.
            </div>
          )}
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
              showCountdown={showCountdown}
              onResetForFun={resetForFun}
              practice={practice}
            />
          )}
        </div>
      )}
    </>
  );
}

async function fetchStats(puzzleId: number): Promise<StatsDTO | null> {
  try {
    const res = await fetch(`/api/stats/${puzzleId}`);
    if (!res.ok) return null;
    return (await res.json()) as StatsDTO;
  } catch {
    return null;
  }
}

async function fetchResultAndStats(
  puzzleId: number,
  sessionId: string,
  play: PlayRecord,
): Promise<{ res: PuzzleResultDTO | null; st: StatsDTO | null }> {
  let res: PuzzleResultDTO | null = null;
  try {
    const playRes = await fetch('/api/play', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        puzzleId,
        sessionId,
        cluesUsed: play.cluesRevealed,
        solved: play.solved,
      }),
    });
    if (playRes.ok) res = (await playRes.json()) as PuzzleResultDTO;
  } catch {
    // ignore
  }
  const st = await fetchStats(puzzleId);
  return { res, st };
}
