'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Initial {
  id?: string;
  name?: string;
  category?: string;
  aliases?: string[];
  description?: string | null;
}

interface Props {
  mode: 'create' | 'edit';
  initial?: Initial;
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export default function DiagnosisForm({ mode, initial }: Props) {
  const router = useRouter();
  const [id, setId] = useState(initial?.id || '');
  const [name, setName] = useState(initial?.name || '');
  const [category, setCategory] = useState(initial?.category || '');
  const [aliases, setAliases] = useState((initial?.aliases || []).join(', '));
  const [description, setDescription] = useState(initial?.description || '');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);

    const body = {
      id: id.trim() || slugify(name),
      name: name.trim(),
      category: category.trim(),
      aliases: aliases
        .split(',')
        .map((a) => a.trim())
        .filter(Boolean),
      description: description.trim() || null,
    };

    let res: Response;
    if (mode === 'create') {
      res = await fetch('/api/admin/diagnoses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    } else {
      res = await fetch(`/api/admin/diagnoses/${encodeURIComponent(initial!.id!)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    }

    if (!res.ok) {
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      setError(j.error || 'Save failed');
      setPending(false);
      return;
    }

    router.push('/admin/diagnoses');
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-lg border border-border bg-panel p-5">
      <Field label="Name" required>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full rounded-md border border-border bg-panelAlt px-3 py-2 text-gray-100"
        />
      </Field>
      <Field label="ID (slug)" hint="Auto-generated from name if blank. Cannot be changed once set.">
        <input
          value={id}
          onChange={(e) => setId(e.target.value)}
          disabled={mode === 'edit'}
          placeholder={slugify(name)}
          className="w-full rounded-md border border-border bg-panelAlt px-3 py-2 font-mono text-sm text-gray-100 disabled:opacity-50"
        />
      </Field>
      <Field label="Category" required>
        <input
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          required
          placeholder="e.g. motor-esc, radio, video"
          className="w-full rounded-md border border-border bg-panelAlt px-3 py-2 text-gray-100"
        />
      </Field>
      <Field label="Aliases" hint="Comma-separated. Used by the autocomplete.">
        <input
          value={aliases}
          onChange={(e) => setAliases(e.target.value)}
          placeholder="motor desync, desync"
          className="w-full rounded-md border border-border bg-panelAlt px-3 py-2 text-gray-100"
        />
      </Field>
      <Field label="Description" hint="Optional, for admin reference only.">
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full rounded-md border border-border bg-panelAlt px-3 py-2 text-gray-100"
        />
      </Field>

      {error && <div className="text-sm text-danger">{error}</div>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-bg hover:brightness-110 disabled:opacity-50"
        >
          {pending ? 'Saving…' : mode === 'create' ? 'Create' : 'Save changes'}
        </button>
        <button
          type="button"
          onClick={() => router.push('/admin/diagnoses')}
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
    <label className="block">
      <span className="mb-1 block text-xs uppercase tracking-wider text-muted">
        {label}
        {required && <span className="text-danger"> *</span>}
      </span>
      {children}
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  );
}
