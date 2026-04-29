'use client';

import { useRouter } from 'next/navigation';

export default function LogoutButton() {
  const router = useRouter();
  async function logout() {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin/login');
    router.refresh();
  }
  return (
    <button
      onClick={logout}
      className="rounded-md border border-border bg-panelAlt px-3 py-1.5 text-xs text-gray-200 hover:bg-panel"
    >
      Log out
    </button>
  );
}
