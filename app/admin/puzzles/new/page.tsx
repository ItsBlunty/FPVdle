import PuzzleForm from '@/components/admin/PuzzleForm';

export default function NewPuzzlePage() {
  return (
    <div>
      <h1 className="mb-4 text-xl font-bold text-white">New puzzle</h1>
      <PuzzleForm mode="create" />
    </div>
  );
}
