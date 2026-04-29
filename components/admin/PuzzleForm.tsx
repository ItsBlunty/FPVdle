'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import ClueEditor, { ClueDraft } from './ClueEditor';

interface Diagnosis {
  id: string;
  name: string;
  category: string;
  aliases: string[];
}

interface InitialPuzzle {
  id: number;
  publishDate: string;
  answerId: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  explanation: string;
  clues: ClueDraft[];
}

interface Props {
  mode: 'create' | 'edit';
  initial?: InitialPuzzle;
}

const DIFFICULTIES = ['beginner', 'intermediate', 'advanced'] as const;

export default function PuzzleForm({ mode, initial }: Props) {
  const router = useRouter();

  const [publishDate, setPublishDate] = useState(initial?.publishDate || '');
  const [answerId, setAnswerId] = useState(initial?.answerId || '');
  const [difficulty, setDifficulty] = useState<(typeof DIFFICULTIES)[number]>(
    initial?.difficulty || 'beginner',
  );
  const [explanation, setExplanation] = useState(initial?.explanation || '');
  const [clues, setClues] = useState<ClueDraft[]>(
    initial?.clues || [{ position: 1, type: 'text', content: '', caption: '' }],
  );

  const [diagnoses, setDiagnoses] = useState<Diagnosis[]>([]);
  const [diagnosisQuery, setDiagnosisQuery] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/diagnoses')
      .then((r) => r.json())
      .then((d: Diagnosis[]) => setDiagnoses(d))
      .catch(() => setDiagnoses([]));
  }, []);

  const filteredDiagnoses = useMemo(() => {
    const q = diagnosisQuery.trim().toLowerCase();
    if (!q) return diagnoses.slice(0, 100);
    return diagnoses
      .filter((d) => {
        if (d.name.toLowerCase().includes(q)) return true;
        if (d.id.toLowerCase().includes(q)) return true;
        if (d.aliases.some((a) => a.toLowerCase().includes(q))) return true;
        return false;
      })
      .slice(0, 100);
  }, [diagnoses, diagnosisQuery]);

  const selectedDiagnosis = diagnoses.find((d) => d.id === answerId);

  function updateClue(idx: number, next: ClueDraft) {
    setClues((cs) => cs.map((c, i) => (i === idx ? next : c)));
  }

  function addClue() {
    setClues((cs) => [...cs, { position: cs.length + 1, type: 'text', content: '', caption: '' }]);
  }

  function removeClue(idx: number) {
    setClues((cs) => cs.filter((_, i) => i !== idx).map((c, i) => ({ ...c, position: i + 1 })));
  }

  function moveClue(idx: number, dir: -1 | 1) {
    setClues((cs) => {
      const next = cs.slice();
      const j = idx + dir;
      if (j < 0 || j >= next.length) return cs;
      [next[idx], next[j]] = [next[j], next[idx]];
      return next.map((c, i) => ({ ...c, position: i + 1 }));
    });
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);

    if (!publishDate) {
      setError('Publish date is required');
      setPending(false);
      return;
    }
    if (!answerId) {
      setError('Pick an answer diagnosis');
      setPending(false);
      return;
    }
    if (clues.length === 0) {
      setError('Add at least one clue');
      setPending(false);
      return;
    }
    for (const c of clues) {
      if (!c.content.trim()) {
        setError(`Clue ${c.position} is missing content`);
        setPending(false);
        return;
      }
    }

    const body = {
      // Date input is YYYY-MM-DD; treat as UTC midnight.
      publishDate: `${publishDate}T00:00:00Z`,
      answerId,
      difficulty,
      explanation: explanation.trim(),
      clues: clues.map((c, i) => ({
        position: i + 1,
        type: c.type,
        content: c.content,
        caption: c.caption || null,
      })),
    };

    const url =
      mode === 'create' ? '/api/admin/puzzles' : `/api/admin/puzzles/${initial!.id}`;
    const method = mode === 'create' ? 'POST' : 'PATCH';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      setError(j.error || 'Save failed');
      setPending(false);
      return;
    }

    router.push('/admin');
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="rounded-lg border border-border bg-panel p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Publish date (UTC)" required>
            <input
              type="date"
              value={publishDate}
              onChange={(e) => setPublishDate(e.target.value)}
              required
              className="w-full rounded-md border border-border bg-panelAlt px-3 py-2 text-gray-100"
            />
          </Field>
          <Field label="Difficulty" required>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as (typeof DIFFICULTIES)[number])}
              className="w-full rounded-md border border-border bg-panelAlt px-3 py-2 text-gray-100"
            >
              {DIFFICULTIES.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field
          label="Answer (diagnosis)"
          required
          hint={
            selectedDiagnosis
              ? `Selected: ${selectedDiagnosis.name} (${selectedDiagnosis.id})`
              : 'Search the diagnosis dictionary'
          }
        >
          <input
            value={diagnosisQuery}
            onChange={(e) => setDiagnosisQuery(e.target.value)}
            placeholder="Filter diagnoses…"
            className="mb-2 w-full rounded-md border border-border bg-panelAlt px-3 py-2 text-gray-100"
          />
          <select
            value={answerId}
            onChange={(e) => setAnswerId(e.target.value)}
            size={Math.min(8, Math.max(3, filteredDiagnoses.length))}
            className="w-full rounded-md border border-border bg-panelAlt px-3 py-2 text-sm text-gray-100"
          >
            <option value="">— pick a diagnosis —</option>
            {filteredDiagnoses.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} ({d.category})
              </option>
            ))}
          </select>
          <a
            href="/admin/diagnoses/new"
            target="_blank"
            rel="noreferrer"
            className="mt-1 inline-block text-xs text-accent hover:underline"
          >
            + Add a new diagnosis (opens in new tab)
          </a>
        </Field>

        <Field label="Explanation" required hint="Shown on the end screen.">
          <textarea
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
            rows={4}
            required
            className="w-full rounded-md border border-border bg-panelAlt px-3 py-2 text-gray-100"
          />
        </Field>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">Clues</h2>
          <button
            type="button"
            onClick={addClue}
            className="rounded-md border border-border bg-panel px-3 py-1.5 text-xs text-gray-200 hover:bg-panelAlt"
          >
            + Add clue
          </button>
        </div>
        <div className="space-y-3">
          {clues.map((c, i) => (
            <ClueEditor
              key={i}
              clue={c}
              index={i}
              total={clues.length}
              onChange={(next) => updateClue(i, next)}
              onRemove={() => removeClue(i)}
              onMoveUp={() => moveClue(i, -1)}
              onMoveDown={() => moveClue(i, 1)}
            />
          ))}
        </div>
      </div>

      {error && <div className="rounded-md bg-danger/10 p-3 text-sm text-danger">{error}</div>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-bg hover:brightness-110 disabled:opacity-50"
        >
          {pending ? 'Saving…' : mode === 'create' ? 'Create puzzle' : 'Save changes'}
        </button>
        <button
          type="button"
          onClick={() => router.push('/admin')}
          className="rounded-md border border-border bg-panelAlt px-4 py-2 text-sm text-gray-200 hover:bg-panel"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="mt-3 block first:mt-0">
      <span className="mb-1 block text-xs uppercase tracking-wider text-muted">
        {label}
        {required && <span className="text-danger"> *</span>}
      </span>
      {children}
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  );
}
