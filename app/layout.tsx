import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'FPVdle — Daily FPV troubleshooting puzzle',
  description: 'Diagnose a malfunctioning quadcopter from a series of clues. New puzzle every day.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-bg text-gray-200 antialiased">{children}</body>
    </html>
  );
}
