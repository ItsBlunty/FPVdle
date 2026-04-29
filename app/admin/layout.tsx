import AdminNav from '@/components/admin/AdminNav';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg">
      <AdminNav />
      <div className="mx-auto max-w-5xl p-4 sm:p-6">{children}</div>
    </div>
  );
}
