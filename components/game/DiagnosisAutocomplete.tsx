'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { DiagnosisDTO } from '@/lib/types';

interface Props {
  diagnoses: DiagnosisDTO[];
  excludeIds?: Set<string>;
  disabled?: boolean;
  onSubmit: (diagnosisId: string) => void;
}

export default function DiagnosisAutocomplete({
  diagnoses,
  excludeIds,
  disabled,
  onSubmit,
}: Props) {
  const [query, setQuery] = useState('');
  const [highlight, setHighlight] = useState(0);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return diagnoses
      .filter((d) => !excludeIds?.has(d.id))
      .filter((d) => {
        if (d.name.toLowerCase().includes(q)) return true;
        if (d.aliases.some((a) => a.toLowerCase().includes(q))) return true;
        return false;
      })
      .slice(0, 8);
  }, [query, diagnoses, excludeIds]);

  useEffect(() => {
    setHighlight(0);
  }, [query]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    window.addEventListener('mousedown', onClick);
    return () => window.removeEventListener('mousedown', onClick);
  }, []);

  function pick(d: DiagnosisDTO) {
    onSubmit(d.id);
    setQuery('');
    setOpen(false);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      setHighlight((h) => Math.min(h + 1, Math.max(matches.length - 1, 0)));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const choice = matches[highlight];
      if (choice) pick(choice);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  }

  return (
    <div ref={wrapRef} className="relative">
      <div className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          disabled={disabled}
          placeholder="What's the issue?"
          className="flex-1 rounded-md border border-border bg-panelAlt px-3 py-2 text-base text-gray-100 placeholder:text-muted focus:border-accent focus:outline-none disabled:opacity-50"
          autoComplete="off"
        />
        <button
          type="button"
          onClick={() => {
            const choice = matches[highlight];
            if (choice) pick(choice);
          }}
          disabled={disabled || matches.length === 0}
          className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-bg hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Submit
        </button>
      </div>

      {open && matches.length > 0 && (
        <ul className="absolute z-10 mt-1 max-h-72 w-full overflow-y-auto rounded-md border border-border bg-panel shadow-lg">
          {matches.map((d, i) => (
            <li
              key={d.id}
              onMouseEnter={() => setHighlight(i)}
              onMouseDown={(e) => {
                e.preventDefault();
                pick(d);
              }}
              className={`cursor-pointer px-3 py-2 text-sm ${
                i === highlight ? 'bg-panelAlt text-white' : 'text-gray-200'
              }`}
            >
              <div>{d.name}</div>
              {d.aliases.length > 0 && (
                <div className="text-xs text-muted">{d.aliases.join(', ')}</div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
