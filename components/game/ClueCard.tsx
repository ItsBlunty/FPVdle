import type { ClueDTO } from '@/lib/types';

interface Props {
  clue: ClueDTO;
  index: number;
  total: number;
}

export default function ClueCard({ clue, index, total }: Props) {
  return (
    <div className="rounded-lg border border-border bg-panel p-4 sm:p-5">
      <div className="mb-2 text-xs uppercase tracking-wider text-muted">
        Clue {index} of {total}
      </div>
      {clue.type === 'text' && (
        <p className="text-base leading-relaxed text-gray-100">{clue.content}</p>
      )}
      {clue.type === 'image' && (
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={clue.content}
            alt={clue.caption || `Clue ${index} image`}
            className="max-h-96 w-full rounded-md object-contain"
          />
          {clue.caption && <p className="mt-2 text-sm text-muted">{clue.caption}</p>}
        </div>
      )}
      {clue.type === 'video' && (
        <div>
          <video
            src={clue.content}
            controls
            playsInline
            className="max-h-96 w-full rounded-md bg-black"
          />
          {clue.caption && <p className="mt-2 text-sm text-muted">{clue.caption}</p>}
        </div>
      )}
    </div>
  );
}
