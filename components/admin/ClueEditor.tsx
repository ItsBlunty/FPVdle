'use client';

import MediaUpload from './MediaUpload';

export interface ClueDraft {
  position: number;
  type: 'text' | 'image' | 'video';
  content: string;
  caption: string;
}

interface Props {
  clue: ClueDraft;
  index: number;
  total: number;
  onChange: (next: ClueDraft) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

export default function ClueEditor({
  clue,
  index,
  total,
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown,
}: Props) {
  return (
    <div className="rounded-lg border border-border bg-panel p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-panelAlt px-2 py-0.5 text-xs text-muted">
            Clue {index + 1}
          </span>
          <select
            value={clue.type}
            onChange={(e) =>
              onChange({
                ...clue,
                type: e.target.value as ClueDraft['type'],
                content: '',
                caption: '',
              })
            }
            className="rounded-md border border-border bg-panelAlt px-2 py-1 text-xs text-gray-100"
          >
            <option value="text">Text</option>
            <option value="image">Image</option>
            <option value="video">Video</option>
          </select>
        </div>
        <div className="flex items-center gap-1 text-xs">
          <button
            type="button"
            onClick={onMoveUp}
            disabled={index === 0}
            className="rounded border border-border bg-panelAlt px-2 py-1 text-gray-200 disabled:opacity-30"
            aria-label="Move up"
          >
            ↑
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={index === total - 1}
            className="rounded border border-border bg-panelAlt px-2 py-1 text-gray-200 disabled:opacity-30"
            aria-label="Move down"
          >
            ↓
          </button>
          <button
            type="button"
            onClick={onRemove}
            className="rounded border border-border bg-panelAlt px-2 py-1 text-danger"
          >
            Remove
          </button>
        </div>
      </div>

      {clue.type === 'text' ? (
        <textarea
          value={clue.content}
          onChange={(e) => onChange({ ...clue, content: e.target.value })}
          rows={3}
          placeholder="Describe what the player sees, hears, or notices."
          className="w-full rounded-md border border-border bg-panelAlt px-3 py-2 text-sm text-gray-100"
        />
      ) : (
        <div className="space-y-2">
          <MediaUpload
            kind={clue.type}
            value={clue.content}
            onChange={(path) => onChange({ ...clue, content: path })}
          />
          <input
            value={clue.caption}
            onChange={(e) => onChange({ ...clue, caption: e.target.value })}
            placeholder="Optional caption"
            className="w-full rounded-md border border-border bg-panelAlt px-3 py-2 text-sm text-gray-100"
          />
        </div>
      )}
    </div>
  );
}
