import DiagnosisForm from '@/components/admin/DiagnosisForm';

export default function NewDiagnosisPage() {
  return (
    <div>
      <h1 className="mb-4 text-xl font-bold text-white">New diagnosis</h1>
      <DiagnosisForm mode="create" />
    </div>
  );
}
