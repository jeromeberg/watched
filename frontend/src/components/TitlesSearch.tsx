import { useState, useEffect } from 'react';
import { api, getErrorMessage, isAbortError } from '../api/client';
import { useDebounce } from '../hooks/useDebounce';
import { LibraryTitle, SearchResult, MediaType, MEDIA } from '../types';
import { Poster } from './Poster';
import { Text } from './Text';
import { Input } from './Input';
import { ErrorMessage } from './ErrorMessage';

interface TitlesSearchProps {
  type: MediaType;
  titles: LibraryTitle[];
  onAdd: (title: LibraryTitle) => void;
}

interface SearchReadState {
  key: string;
  results: SearchResult[];
  error: string;
}

export function TitlesSearch({ type, titles, onAdd }: TitlesSearchProps) {
  const [query, setQuery] = useState('');
  const [readState, setReadState] = useState<SearchReadState>({ key: '', results: [], error: '' });
  const [addFailure, setAddFailure] = useState<{ key: string; message: string } | null>(null);
  const [adding, setAdding] = useState<Set<number>>(new Set());

  const debouncedQuery = useDebounce(query, 400);
  const trimmedQuery = debouncedQuery.trim();
  const currentQuery = query.trim();
  const waitingForDebounce = currentQuery !== trimmedQuery;
  const searchKey = `${type}:${trimmedQuery}`;
  const currentSearchKey = `${type}:${currentQuery}`;
  const hasCurrentResponse = !waitingForDebounce && readState.key === searchKey;
  const results = hasCurrentResponse ? readState.results : [];
  const fetching = !!currentQuery && !hasCurrentResponse;
  const searchError = hasCurrentResponse ? readState.error : '';
  const addError = addFailure?.key === currentSearchKey ? addFailure.message : '';
  const myTmdbIds = new Set(titles.map((t) => t.tmdbId));

  useEffect(() => {
    const controller = new AbortController();
    if (!trimmedQuery || waitingForDebounce) {
      return;
    }
    api
      .get<SearchResult[]>(`/${MEDIA[type].path}/search?q=${encodeURIComponent(trimmedQuery)}`, {
        signal: controller.signal,
      })
      .then((searchResults) => {
        if (!controller.signal.aborted) {
          setReadState({ key: searchKey, results: searchResults, error: '' });
        }
      })
      .catch((requestError: unknown) => {
        if (controller.signal.aborted) return;
        if (!isAbortError(requestError)) {
          setReadState({
            key: searchKey,
            results: [],
            error: getErrorMessage(requestError, 'Search failed'),
          });
        }
      });
    return () => controller.abort();
  }, [searchKey, trimmedQuery, type, waitingForDebounce]);

  async function handleAdd(result: SearchResult) {
    const mutationKey = currentSearchKey;
    setAddFailure(null);
    setAdding((prev) => new Set(prev).add(result.tmdbId));
    try {
      const added = await api.post<LibraryTitle>(`/${MEDIA[type].path}`, {
        tmdbId: result.tmdbId,
      });
      onAdd(added);
    } catch (err) {
      setAddFailure({ key: mutationKey, message: getErrorMessage(err, 'Could not add this title') });
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

      {currentQuery && (
        <section>
          {addError && <ErrorMessage>{addError}</ErrorMessage>}
          {searchError && <ErrorMessage>{searchError}</ErrorMessage>}
          <Text as="h2" color="muted" className="mb-4">
            {fetching
              ? 'Searching...'
              : searchError
                ? 'Search failed'
                : results.length === 0
                  ? `No results for "${currentQuery}"`
                  : `Results for "${currentQuery}"`}
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
