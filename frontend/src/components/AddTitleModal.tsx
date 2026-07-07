import { useState, useEffect, useRef } from 'react';
import { api } from '../api/client';
import { Title } from '../types';
import { Modal } from './Modal';
import { Text } from './Text';
import { Input } from './Input';
import { SmallPoster } from './Poster';

interface AddTitleModalProps {
  collectionId: number;
  existingTitleIds: Set<number>;
  onAdd: (title: Title) => void;
  onRemove: (titleId: number) => void;
  onClose: () => void;
}

export function AddTitleModal({
  collectionId,
  existingTitleIds,
  onAdd,
  onRemove,
  onClose,
}: AddTitleModalProps) {
  const [allTitles, setAllTitles] = useState<Title[]>([]);
  const [search, setSearch] = useState('');
  const [toggling, setToggling] = useState<Set<number>>(new Set());
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    Promise.all([api.get<Title[]>('/movies'), api.get<Title[]>('/shows').catch(() => [] as Title[])]).then(
      ([movies, shows]) => {
        setAllTitles([...movies, ...shows]);
      },
    );
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  const filtered = search.trim()
    ? allTitles.filter((t) => t.title.toLowerCase().includes(search.toLowerCase()))
    : allTitles;

  async function toggle(title: Title) {
    const inCollection = existingTitleIds.has(title.id);
    setToggling((prev) => new Set(prev).add(title.id));
    try {
      if (inCollection) {
        await api.delete(`/collections/${collectionId}/items/${title.id}`);
        onRemove(title.id);
      } else {
        await api.post(`/collections/${collectionId}/items`, { titleId: title.id });
        onAdd(title);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setToggling((prev) => {
        const n = new Set(prev);
        n.delete(title.id);
        return n;
      });
    }
  }

  return (
    <Modal onClose={onClose} className="max-w-md flex flex-col max-h-[85vh]">
      <div className="p-5 border-b border-gray-700 space-y-3 shrink-0">
        <div className="flex items-center justify-between">
          <Text as="h2" variant="heading" size="lg">
            Add titles
          </Text>
          <Text
            as="button"
            variant="link"
            size="xl"
            color="subtle"
            className="leading-none"
            onClick={onClose}
          >
            ✕
          </Text>
        </div>
        <Input
          ref={inputRef}
          type="text"
          placeholder="Search your library..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded-xl text-sm"
        />
      </div>

      {/* List */}
      <div className="overflow-y-auto flex-1">
        {allTitles.length === 0 ? (
          <Text color="subtle" className="p-5">
            Loading your library...
          </Text>
        ) : filtered.length === 0 ? (
          <Text color="subtle" className="p-5">
            No titles match "{search}"
          </Text>
        ) : (
          <div className="divide-y divide-gray-700/50">
            {filtered.map((title) => {
              const inCollection = existingTitleIds.has(title.id);
              const isToggling = toggling.has(title.id);
              return (
                <div key={title.id} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-750">
                  <SmallPoster title={title} />
                  <div className="flex-1 min-w-0">
                    <Text size="sm" color="white" className="font-medium truncate">
                      {title.title}
                    </Text>
                    <Text size="xs" color="subtle">
                      {title.releaseYear ?? '—'} · {title.type === 'TV' ? 'TV Show' : 'Movie'}
                    </Text>
                  </div>
                  <button
                    onClick={() => toggle(title)}
                    disabled={isToggling}
                    className={`shrink-0 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 ${
                      inCollection
                        ? 'bg-blue-600/20 text-blue-300 hover:bg-red-600/20 hover:text-red-300'
                        : 'bg-gray-700 text-gray-300 hover:bg-blue-600 hover:text-white'
                    }`}
                  >
                    {isToggling ? '...' : inCollection ? '✓ Added' : '+ Add'}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Modal>
  );
}
