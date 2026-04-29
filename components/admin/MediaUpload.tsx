'use client';

import { useState } from 'react';

interface Props {
  kind: 'image' | 'video';
  value: string;
  onChange: (path: string) => void;
}

export default function MediaUpload({ kind, value, onChange }: Props) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPending(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('kind', kind);
      const res = await fetch('/api/admin/upload', { method: 'POST', body: fd });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        setError(j.error || 'Upload failed');
        setPending(false);
        return;
      }
      const { path } = (await res.json()) as { path: string };
      onChange(path);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setPending(false);
      e.target.value = '';
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <input
          type="file"
          accept={kind === 'image' ? 'image/*' : 'video/*'}
          onChange={onFile}
          disabled={pending}
          className="block w-full text-xs text-muted file:mr-3 file:rounded-md file:border-0 file:bg-accent file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-bg file:hover:brightness-110"
        />
        {pending && <span className="text-xs text-muted">Uploading…</span>}
      </div>
      {value && (
        <div className="rounded-md border border-border bg-panelAlt p-2">
          <div className="mb-1 font-mono text-xs text-muted">{value}</div>
          {kind === 'image' ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="preview" className="max-h-48 rounded" />
          ) : (
            <video src={value} controls className="max-h-48 rounded bg-black" />
          )}
        </div>
      )}
      {error && <div className="text-xs text-danger">{error}</div>}
    </div>
  );
}
