import { useState } from 'react';
import { StarRating } from './Rating';
import { useAuth } from '../context/AuthContext';
import { WatchStatus, MediaType } from '../types';
import { TitleUpdates, useTitleDetail } from '../hooks/useTitleDetail';
import { Text } from './Text';
import { Button } from './Button';
import { Textarea } from './Textarea';
import { DeleteModal } from './DeleteModal';
import { ErrorMessage } from './ErrorMessage';

interface DetailProps {
  type: MediaType;
  id: string | number;
  username?: string;
  onUpdate?: (id: number, updates: TitleUpdates) => void;
  onRemove?: (id: number) => void;
}

const STATUSES: WatchStatus[] = ['TO_WATCH', 'WATCHED'];

export function Detail({ type, id, username, onUpdate, onRemove }: DetailProps) {
  const { user } = useAuth();
  const isOtherUser = !!username && username !== user?.username;
  const [notesSaved, setNotesSaved] = useState(false);
  const [notesDraft, setNotesDraft] = useState<{ key: string; value: string } | null>(null);
  const [showDelete, setShowDelete] = useState(false);
  const {
    title,
    loading,
    notFound,
    loadError,
    mutationError,
    savingStatus,
    savingRating,
    updateStatus,
    updateRating,
    updateNotes,
    deleteTitle,
  } = useTitleDetail({ type, id, username, isOtherUser, onUpdate, onRemove });

  if (notFound) {
    return <Text color="subtle">{isOtherUser ? 'Not found.' : 'Not found or not in your list.'}</Text>;
  }

  if (loadError) {
    return <ErrorMessage>{loadError}</ErrorMessage>;
  }

  if (loading || !title) {
    return <Text color="subtle">Loading...</Text>;
  }

  const notesKey = `${username ?? ''}:${title.id}`;
  const localNotes = notesDraft?.key === notesKey ? notesDraft.value : (title.notes ?? '');

  async function handleNotesSave() {
    const notes = localNotes.trim() || null;
    if (!(await updateNotes(notes))) return;
    setNotesSaved(true);
    setTimeout(() => setNotesSaved(false), 1500);
  }

  return (
    <div className="space-y-8">
      {mutationError && <ErrorMessage>{mutationError}</ErrorMessage>}
      {/* Header */}
      <div className="flex gap-6">
        <div className="w-28 shrink-0 aspect-[2/3] rounded-xl overflow-hidden bg-gray-800">
          {title.posterUrl ? (
            <img src={title.posterUrl} alt={title.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-end p-3">
              <Text as="span" size="xs" color="muted">
                {title.title}
              </Text>
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0 space-y-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <Text as="h1" variant="heading" size="2xl" className="leading-tight">
                {title.title}
              </Text>

              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <Text variant="label" color="muted">
                  {title.releaseYear ?? '—'} {title.director && '-'} {title.director}
                </Text>
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="flex gap-2">
            {STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => updateStatus(s)}
                disabled={savingStatus || isOtherUser}
                className={`text-xs px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 ${
                  title.status === s
                    ? s === 'WATCHED'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                {s === 'WATCHED' ? '✓ Watched' : '⊙ To watch'}
              </button>
            ))}
          </div>

          {/* Rating */}
          <StarRating value={title.rating} onChange={updateRating} disabled={savingRating || isOtherUser} />
        </div>
      </div>

      {title.imdbId && (
        <div>
          <a
            href={`https://www.imdb.com/title/${title.imdbId}/`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block rounded-sm bg-[#F5C518] px-2 py-1 text-xs font-bold text-black transition-colors hover:bg-[#E4B613]"
          >
            IMDb
          </a>
        </div>
      )}

      {/* Overview */}
      {title.description && (
        <div className="space-y-1.5">
          <Text variant="label">Overview</Text>
          <Text color="muted" className="leading-relaxed">
            {title.description}
          </Text>
        </div>
      )}

      {/* Notes */}
      {isOtherUser ? (
        title.notes && (
          <div className="space-y-1.5">
            <Text variant="label">Notes</Text>
            <Text color="white" className="bg-gray-800 rounded-xl px-4 py-3 whitespace-pre-wrap">
              {title.notes}
            </Text>
          </div>
        )
      ) : (
        <div className="space-y-1.5">
          <Text variant="label">
            Notes
            {notesSaved && (
              <Text as="span" size="xs" color="success" className="ml-2 normal-case">
                Saved
              </Text>
            )}
          </Text>
          <Textarea
            value={localNotes}
            onChange={(e) => setNotesDraft({ key: notesKey, value: e.target.value })}
            onBlur={handleNotesSave}
            rows={2}
            maxLength={500}
            placeholder="Add a comment..."
            className="text-sm"
          />
        </div>
      )}

      {/* Delete button */}
      {!isOtherUser && (
        <Button variant="dangerOutline" onClick={() => setShowDelete(true)}>
          Delete
        </Button>
      )}

      {showDelete && (
        <DeleteModal
          heading="Remove title"
          message={`Remove "${title.title}" from your list? This cannot be undone.`}
          onConfirm={deleteTitle}
          onClose={() => setShowDelete(false)}
        />
      )}
    </div>
  );
}
