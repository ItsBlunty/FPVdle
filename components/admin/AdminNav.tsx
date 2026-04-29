'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import LogoutButton from './LogoutButton';

export default function AdminNav() {
  const pathname = usePathname();
  if (pathname === '/admin/login') return null;

  return (
    <nav className="border-b border-border bg-panel">
      <div className="mx-auto flex max-w-5xl items-center justify-between p-3">
        <div className="flex items-center gap-4">
          <Link href="/admin" className="text-sm font-bold text-white">
            FPVdle Admin
          </Link>
          <Link href="/admin" className="text-sm text-gray-300 hover:text-white">
            Puzzles
          </Link>
          <Link href="/admin/diagnoses" className="text-sm text-gray-300 hover:text-white">
            Diagnoses
          </Link>
          <Link href="/" className="text-sm text-muted hover:text-white">
            ← View site
          </Link>
        </div>
        <LogoutButton />
      </div>
    </nav>
  );
}
