import type { DiagnosisDTO } from '@/lib/types';

interface Props {
  guesses: string[];
  diagnoses: DiagnosisDTO[];
}

export default function GuessHistory({ guesses, diagnoses }: Props) {
  if (guesses.length === 0) return null;

  const byId = new Map(diagnoses.map((d) => [d.id, d]));

  return (
    <div className="flex flex-wrap gap-2">
      {guesses.map((id, i) => {
        const d = byId.get(id);
        return (
          <span
            key={`${id}-${i}`}
            className="guess-chip rounded-full border border-border bg-panelAlt px-3 py-1 text-xs text-muted"
          >
            {d?.name ?? id}
          </span>
        );
      })}
    </div>
  );
}
