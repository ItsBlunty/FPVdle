'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

interface Diagnosis {
  id: string;
  name: string;
  category: string;
  aliases: string[];
  description: string | null;
}

export default function DiagnosesPage() {
  const [diagnoses, setDiagnoses] = useState<Diagnosis[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch('/api/admin/diagnoses');
    if (res.ok) {
      setDiagnoses((await res.json()) as Diagnosis[]);
    } else {
      setError('Failed to load diagnoses');
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function onDelete(id: string) {
    if (!confirm(`Delete diagnosis "${id}"? This cannot be undone.`)) return;
    const res = await fetch(`/api/admin/diagnoses/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      alert(j.error || 'Delete failed');
      return;
    }
    load();
  }

  return (
    <div>
      <header className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">Diagnoses</h1>
        <Link
          href="/admin/diagnoses/new"
          className="rounded-md bg-accent px-3 py-1.5 text-sm font-semibold text-bg hover:brightness-110"
        >
          + New diagnosis
        </Link>
      </header>

      {error && <div className="mb-3 text-sm text-danger">{error}</div>}

      {loading ? (
        <div className="text-muted">Loading…</div>
      ) : diagnoses.length === 0 ? (
        <div className="rounded-lg border border-border bg-panel p-6 text-center text-sm text-muted">
          No diagnoses yet.
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-panel">
          <table className="w-full text-sm">
            <thead className="bg-panelAlt text-left text-xs uppercase tracking-wider text-muted">
              <tr>
                <th className="p-3">Name</th>
                <th className="p-3">ID</th>
                <th className="p-3">Category</th>
                <th className="p-3">Aliases</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {diagnoses.map((d) => (
                <tr key={d.id}>
                  <td className="p-3 font-medium text-gray-100">{d.name}</td>
                  <td className="p-3 font-mono text-xs text-muted">{d.id}</td>
                  <td className="p-3 text-muted">{d.category}</td>
                  <td className="p-3 text-xs text-muted">{d.aliases.join(', ') || '—'}</td>
                  <td className="p-3 text-right">
                    <Link
                      href={`/admin/diagnoses/${encodeURIComponent(d.id)}`}
                      className="mr-2 text-xs text-accent hover:underline"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => onDelete(d.id)}
                      className="text-xs text-danger hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
