import { useState, useEffect } from 'react';
import { StarRating } from './Rating';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Title, WatchStatus, MediaType, MEDIA, Season } from '../types';
import { Text } from './Text';
import { Button, buttonClasses } from './Button';
import { ShowSeasons } from './ShowSeasons';
import { Textarea } from './Textarea';
import { DeleteModal } from './DeleteModal';

export type TitleUpdates = Partial<Pick<Title, 'rating' | 'status' | 'notes'>>;

interface DetailProps {
  type: MediaType;
  id: string | number;
  username?: string;
  onUpdate?: (id: number, updates: TitleUpdates) => void;
  onRemove?: (id: number) => void;
}

export function Detail({ type, id, username, onUpdate, onRemove }: DetailProps) {
  const { user } = useAuth();
  const titleId = Number(id);
  const isOtherUser = !!username && username !== user?.username;
  const basePath = isOtherUser
    ? `/users/${username}/${MEDIA[type].path}/${id}`
    : `/${MEDIA[type].path}/${id}`;

  const [title, setTitle] = useState<Title | null>(null);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [notFound, setNotFound] = useState(false);
  const [savingStatus, setSavingStatus] = useState(false);
  const [savingRating, setSavingRating] = useState(false);
  const [notesSaved, setNotesSaved] = useState(false);
  const [localNotes, setLocalNotes] = useState('');
  const [showDelete, setShowDelete] = useState(false);

  useEffect(() => {
    setNotFound(false);
    setTitle(null);
    setSeasons([]);

    Promise.all([
      api.get<Title | null>(basePath),
      type === 'show' ? api.get<Season[]>(`${basePath}/episodes`) : Promise.resolve<Season[]>([]),
    ])
      .then(([titleData, seasonData]) => {
        if (!titleData) {
          setNotFound(true);
          return;
        }
        setTitle(titleData);
        setLocalNotes(titleData.notes ?? '');
        setSeasons(seasonData);
      })
      .catch(() => setNotFound(true));
  }, [type, id, basePath]);

  if (notFound) {
    return <Text color="subtle">{isOtherUser ? 'Not found.' : 'Not found or not in your list.'}</Text>;
  }

  if (!title) {
    return <Text color="subtle">Loading...</Text>;
  }

  const totalEps = seasons.reduce((n, s) => n + s.episodes.length, 0);
  const watchedEps = seasons.reduce((n, s) => n + s.episodes.filter((e) => e.watched).length, 0);
  const pct = totalEps > 0 ? Math.round((watchedEps / totalEps) * 100) : 0;

  async function handleUpdate(updates: TitleUpdates) {
    await api.patch(`/titles/${titleId}`, updates);
    setTitle((prev) => (prev ? { ...prev, ...updates } : prev));
    onUpdate?.(titleId, updates);
  }

  async function handleStatus(status: WatchStatus) {
    if (status === title!.status) return;
    setSavingStatus(true);
    try {
      await handleUpdate({ status });
    } finally {
      setSavingStatus(false);
    }
  }

  async function handleRating(rating: number | null) {
    setSavingRating(true);
    try {
      await handleUpdate({ rating });
    } finally {
      setSavingRating(false);
    }
  }

  async function handleNotesSave() {
    const notes = localNotes.trim() || null;
    if (notes === title!.notes) return;
    await handleUpdate({ notes });
    setNotesSaved(true);
    setTimeout(() => setNotesSaved(false), 1500);
  }

  async function handleDelete() {
    await api.delete(`/titles/${titleId}`);
    onRemove?.(titleId);
  }

  return (
    <div className="space-y-8">
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
            {(['TO_WATCH', 'WATCHED'] as WatchStatus[]).map((s) => (
              <button
                key={s}
                onClick={() => handleStatus(s)}
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
          <StarRating value={title.rating} onChange={handleRating} disabled={savingRating || isOtherUser} />

          
        </div>
      </div>

      {title.imdbId && (
            <div><a
              href={`https://www.imdb.com/title/${title.imdbId}/`}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonClasses('yellow', 'xs', 'inline-block')}
            >
              IMDb
            </a></div>
          )}

      {/* Progress (for shows) */}
          {type === 'show' && totalEps > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>
                  {watchedEps} / {totalEps} episodes
                </span>
                <span className="font-medium text-white">{pct}%</span>
              </div>
              <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full transition-all duration-300"
                  style={{ width: `${pct}%` }}
                />
              </div>
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
            onChange={(e) => setLocalNotes(e.target.value)}
            onBlur={handleNotesSave}
            rows={2}
            maxLength={500}
            placeholder="Add a comment..."
            className="text-sm"
          />
        </div>
      )}

      {/* Seasons (for shows) */}
      {type === 'show' && (
        <div className="space-y-1.5">
          <Text variant="label">Episodes</Text>


            

          <ShowSeasons
            key={titleId}
            seasons={seasons}
            onSeasonsChange={setSeasons}
            isOtherUser={isOtherUser}
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
          onConfirm={handleDelete}
          onClose={() => setShowDelete(false)}
        />
      )}
    </div>
  );
}
