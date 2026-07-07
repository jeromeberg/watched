import { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useDebounce } from '../hooks/useDebounce';
import { Title, SearchResult, MediaType, MEDIA } from '../types';
import { Poster } from './Poster';
import { Text } from './Text';
import { Input } from './Input';

interface TitlesSearchProps {
  type: MediaType;
  titles: Title[];
  onAdd: (title: Title) => void;
}

export function TitlesSearch({ type, titles, onAdd }: TitlesSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [fetching, setFetching] = useState(false);
  const [adding, setAdding] = useState<Set<number>>(new Set());

  const debouncedQuery = useDebounce(query, 400);
  const trimmedQuery = debouncedQuery.trim();
  const myTmdbIds = new Set(titles.map((t) => t.tmdbId));

  useEffect(() => {
    if (!trimmedQuery) {
      setResults([]);
      return;
    }
    setFetching(true);
    api
      .get<SearchResult[]>(`/${MEDIA[type].path}/search?q=${encodeURIComponent(trimmedQuery)}`)
      .then(setResults)
      .catch(console.error)
      .finally(() => setFetching(false));
  }, [trimmedQuery, type]);

  async function handleAdd(result: SearchResult) {
    setAdding((prev) => new Set(prev).add(result.tmdbId));
    try {
      const added = await api.post<Title>(`/${MEDIA[type].path}`, {
        tmdbId: result.tmdbId,
        title: result.title,
        posterUrl: result.posterUrl,
        releaseYear: result.releaseYear,
        director: result.director,
      });
      onAdd(added);
    } catch (err) {
      console.error(err);
    } finally {
      setAdding((prev) => {
        const next = new Set(prev);
        next.delete(result.tmdbId);
        return next;
      });
    }
  }

  return (
    <>
      <div className="relative">
        <Input
          variant="surface"
          type="text"
          placeholder={`Search for a ${MEDIA[type].noun}...`}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="rounded-xl px-5 py-3"
        />
        {query && (
          <Text
            as="button"
            variant="link"
            size="base"
            color="subtle"
            onClick={() => setQuery('')}
            className="absolute right-4 top-1/2 -translate-y-1/2"
          >
            ✕
          </Text>
        )}
      </div>

      {trimmedQuery && (
        <section>
          <Text as="h2" color="muted" className="mb-4">
            {fetching
              ? 'Searching...'
              : results.length === 0
                ? `No results for "${trimmedQuery}"`
                : `Results for "${trimmedQuery}"`}
          </Text>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
            {results.map((result) => {
              const added = myTmdbIds.has(result.tmdbId);
              const isAdding = adding.has(result.tmdbId);
              return (
                <div key={result.tmdbId}>
                  <Poster title={result} />
                  <div className="mt-2 space-y-0.5">
                    <Text size="sm" color="white" className="font-medium leading-tight line-clamp-1">
                      {result.title}
                    </Text>
                    <Text size="xs" color="muted">
                      {result.releaseYear ?? '—'}
                    </Text>
                    <Text size="xs" color="muted">
                      {result.director ?? '—'}
                    </Text>
                    <button
                      onClick={() => !added && handleAdd(result)}
                      disabled={isAdding || added}
                      className={`mt-1.5 w-full text-xs py-1.5 rounded-md font-medium transition-colors ${
                        added
                          ? 'bg-gray-700 text-gray-400 cursor-default'
                          : 'bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-50'
                      }`}
                    >
                      {isAdding ? '...' : added ? 'In list' : '+ Add'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </>
  );
}
