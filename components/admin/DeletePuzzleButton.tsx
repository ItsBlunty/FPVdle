'use client';

import { useRouter } from 'next/navigation';

export default function DeletePuzzleButton({ id }: { id: number }) {
  const router = useRouter();

  async function onDelete() {
    if (!confirm('Delete this puzzle? Plays for it will also be removed.')) return;
    const res = await fetch(`/api/admin/puzzles/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      alert(j.error || 'Delete failed');
      return;
    }
    router.refresh();
  }

  return (
    <button onClick={onDelete} className="text-xs text-danger hover:underline">
      Delete
    </button>
  );
}
