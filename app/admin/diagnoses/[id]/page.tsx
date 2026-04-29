import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import DiagnosisForm from '@/components/admin/DiagnosisForm';

export const dynamic = 'force-dynamic';

export default async function EditDiagnosisPage({ params }: { params: { id: string } }) {
  const d = await prisma.diagnosis.findUnique({ where: { id: params.id } });
  if (!d) notFound();

  return (
    <div>
      <h1 className="mb-4 text-xl font-bold text-white">Edit diagnosis</h1>
      <DiagnosisForm
        mode="edit"
        initial={{
          id: d.id,
          name: d.name,
          category: d.category,
          aliases: d.aliases,
          description: d.description,
        }}
      />
    </div>
  );
}
