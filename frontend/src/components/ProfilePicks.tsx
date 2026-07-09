import { useState } from 'react';
import { api } from '../api/client';
import { PublicProfile, Title } from '../types';
import { Poster } from './Poster';
import { Button } from './Button';
import { Text } from './Text';

interface ProfilePicksProps {
  username: string;
  topPicks: PublicProfile['topPicks'];
  isOwnProfile: boolean;
  onSaved: (topPicks: PublicProfile['topPicks']) => void;
}

export function ProfilePicks({ username, topPicks, isOwnProfile, onSaved }: ProfilePicksProps) {
  const [editing, setEditing] = useState(false);
  const [allTitles, setAllTitles] = useState<Title[]>([]);
  const [picks, setPicks] = useState<Title[]>([]);
  const [saving, setSaving] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<{ index: number; side: 'before' | 'after' } | null>(null);

  async function startEditing() {
    // The picker needs the full library; only fetched when entering edit mode.
    const [movies, shows] = await Promise.all([
      api.get<Title[]>('/movies'),
      api.get<Title[]>('/shows').catch(() => [] as Title[]),
    ]);
    const combined = [...movies, ...shows];
    setAllTitles(combined);
    setPicks(
      [...topPicks]
        .sort((a, b) => a.rank - b.rank)
        .map((p) => combined.find((t) => t.id === p.title.id))
        .filter((t): t is Title => t !== undefined),
    );
    setEditing(true);
  }

  function togglePick(title: Title) {
    setPicks((prev) => {
      const without = prev.filter((p) => p.id !== title.id);
      if (without.length !== prev.length) return without;
      return prev.length < 5 ? [...prev, title] : prev;
    });
  }

  function reorderPicks(from: number, to: number) {
    setPicks((prev) => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  }

  async function handleSave() {
    setSaving(true);
    try {
      await api.patch('/me/profile', { topPicks: picks.map((p) => p.id) });
      const updated = await api.get<PublicProfile>(`/users/${username}/public`);
      onSaved(updated.topPicks);
      setEditing(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  if (!editing && topPicks.length === 0 && !isOwnProfile) return null;

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <Text as="h2" variant="label">
          ⭐️ Top Picks
        </Text>
        {isOwnProfile &&
          (editing ? (
            <Text as="span" size="xs" color="faint">
              {picks.length}/5 selected
            </Text>
          ) : (
            <Button variant="secondary" onClick={startEditing}>
              Edit picks
            </Button>
          ))}
      </div>

      {editing ? (
        <>
          {picks.length > 0 && (
            <div className="flex gap-4 flex-wrap">
              {picks.map((p, i) => (
                <div
                  key={p.id}
                  draggable
                  onDragStart={() => setDragIndex(i)}
                  onDragOver={(e) => {
                    e.preventDefault();
                    const rect = e.currentTarget.getBoundingClientRect();
                    const side = e.clientX - rect.left < rect.width / 2 ? 'before' : 'after';
                    setDragOver({ index: i, side });
                  }}
                  onDrop={() => {
                    if (dragIndex !== null && dragOver !== null) {
                      const rawTarget = dragOver.side === 'before' ? dragOver.index : dragOver.index + 1;
                      const target = dragIndex < rawTarget ? rawTarget - 1 : rawTarget;
                      if (target !== dragIndex) reorderPicks(dragIndex, target);
                    }
                    setDragIndex(null);
                    setDragOver(null);
                  }}
                  onDragEnd={() => {
                    setDragIndex(null);
                    setDragOver(null);
                  }}
                  onClick={() => togglePick(p)}
                  className={`relative w-24 cursor-grab active:cursor-grabbing transition-opacity ${dragIndex === i ? 'opacity-40' : ''}`}
                >
                  {dragIndex !== null && dragIndex !== i && dragOver?.index === i && (
                    <div
                      className={`absolute top-0 bottom-0 w-0.5 bg-blue-400 rounded ${
                        dragOver.side === 'before' ? '-left-2' : '-right-2'
                      }`}
                    />
                  )}
                  <div className="rounded-lg ring-2 ring-blue-500">
                    <Poster title={p} />
                  </div>
                  <div className="absolute top-1 left-1 bg-blue-600 text-white text-xs font-bold rounded px-1">
                    {i + 1}
                  </div>
                  <div className="absolute top-1 right-1 bg-black/70 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center hover:bg-red-600 transition-colors">
                    ✕
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button variant="primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </Button>
            <Button variant="ghost" onClick={() => setEditing(false)}>
              Cancel
            </Button>
          </div>

          {/* All titles grid */}
          {allTitles.length === 0 ? (
            <Text color="faint">Add some movies or shows to your list first.</Text>
          ) : (
            <div className="flex flex-wrap gap-3">
              {allTitles.map((t) => {
                const pickIdx = picks.findIndex((p) => p.id === t.id);
                const selected = pickIdx !== -1;
                const disabled = !selected && picks.length >= 5;
                return (
                  <div
                    key={t.id}
                    onClick={() => !disabled && togglePick(t)}
                    className={`relative w-24 cursor-pointer ${disabled ? 'opacity-30 cursor-not-allowed' : ''}`}
                  >
                    <div
                      className={`rounded-lg transition-all ${selected ? 'ring-2 ring-blue-500' : 'hover:ring-1 hover:ring-gray-500'}`}
                    >
                      <Poster title={t} />
                    </div>
                    {selected && (
                      <div className="absolute top-1 left-1 bg-blue-600 text-white text-xs font-bold rounded px-1">
                        {pickIdx + 1}
                      </div>
                    )}
                    <Text size="xs" color="white" className="mt-1 font-medium line-clamp-1">
                      {t.title}
                    </Text>
                  </div>
                );
              })}
            </div>
          )}
        </>
      ) : topPicks.length > 0 ? (
        <div className="flex gap-4 flex-wrap">
          {topPicks.map((pick) => (
            <div key={pick.rank} className="relative w-24">
              <Poster title={pick.title} />
              <div className="absolute top-1.5 left-1.5 bg-black/80 text-white text-xs font-bold rounded px-1.5 py-0.5">
                #{pick.rank}
              </div>
              <Text size="xs" color="white" className="mt-1.5 font-medium line-clamp-1">
                {pick.title.title}
              </Text>
              <Text size="xs" color="subtle">
                {pick.title.releaseYear ?? '—'}
              </Text>
            </div>
          ))}
        </div>
      ) : (
        <Text color="faint">No top picks yet.</Text>
      )}
    </section>
  );
}
