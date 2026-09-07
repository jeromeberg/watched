import { useEffect, useState } from 'react';
import { api, getErrorMessage, isAbortError } from '../api/client';
import { Button } from '../components/Button';
import { ErrorMessage } from '../components/ErrorMessage';
import { FriendUserItem } from '../components/FriendUserItem';
import { Input } from '../components/Input';
import { Layout } from '../components/Layout';
import { Text } from '../components/Text';
import { useDebounce } from '../hooks/useDebounce';
import { FriendSearchResult } from '../types';

interface PeopleSearchState {
  key: string;
  results: FriendSearchResult[];
  error: string;
}

/** Search profiles and manage follow relationships from the results. */
export function PeoplePage() {
  const [query, setQuery] = useState('');
  const [readState, setReadState] = useState<PeopleSearchState>({ key: '', results: [], error: '' });
  const [saving, setSaving] = useState<Set<string>>(new Set());
  const [followError, setFollowError] = useState('');
  const debouncedQuery = useDebounce(query, 400);
  const currentQuery = query.trim();
  const searchQuery = debouncedQuery.trim();
  const waitingForDebounce = currentQuery !== searchQuery;
  const hasCurrentResponse = !waitingForDebounce && readState.key === searchQuery;
  const results = hasCurrentResponse ? readState.results : [];
  const searching = !!currentQuery && !hasCurrentResponse;
  const searchError = hasCurrentResponse ? readState.error : '';

  useEffect(() => {
    const controller = new AbortController();
    if (!searchQuery || waitingForDebounce) return;

    api
      .get<FriendSearchResult[]>(`/users/search?q=${encodeURIComponent(searchQuery)}`, {
        signal: controller.signal,
      })
      .then((searchResults) => {
        if (!controller.signal.aborted) {
          setReadState({ key: searchQuery, results: searchResults, error: '' });
        }
      })
      .catch((requestError: unknown) => {
        if (controller.signal.aborted || isAbortError(requestError)) return;
        setReadState({
          key: searchQuery,
          results: [],
          error: getErrorMessage(requestError, 'Could not search people'),
        });
      });

    return () => controller.abort();
  }, [searchQuery, waitingForDebounce]);

  /** Toggle one result's follow relation and update it in place. */
  async function toggleFollow(result: FriendSearchResult) {
    if (saving.has(result.username)) return;

    setFollowError('');
    setSaving((current) => new Set(current).add(result.username));
    try {
      if (result.isFollowing) {
        await api.delete(`/users/${result.username}/follow`);
      } else {
        await api.post(`/users/${result.username}/follow`, {});
      }
      setReadState((current) => ({
        ...current,
        results: current.results.map((user) =>
          user.username === result.username ? { ...user, isFollowing: !result.isFollowing } : user,
        ),
      }));
    } catch (requestError) {
      setFollowError(
        getErrorMessage(
          requestError,
          result.isFollowing ? 'Could not unfollow user' : 'Could not follow user',
        ),
      );
    } finally {
      setSaving((current) => {
        const next = new Set(current);
        next.delete(result.username);
        return next;
      });
    }
  }

  return (
    <Layout>
      <div className="mx-auto w-full max-w-2xl space-y-6">
        <Text as="h1" variant="heading" size="2xl">
          Find people
        </Text>

        <Input
          variant="surface"
          type="search"
          placeholder="Search by username..."
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setFollowError('');
          }}
          className="rounded-xl px-5 py-3"
          autoFocus
        />

        {followError && <ErrorMessage>{followError}</ErrorMessage>}
        {searchError && <ErrorMessage>{searchError}</ErrorMessage>}

        {!currentQuery ? (
          <Text color="subtle">Search for people by username.</Text>
        ) : searching ? (
          <Text color="subtle">Searching...</Text>
        ) : !searchError && results.length === 0 ? (
          <Text color="faint">No people found.</Text>
        ) : (
          <div>
            {results.map((result) => {
              const isSaving = saving.has(result.username);
              return (
                <FriendUserItem
                  key={result.username}
                  user={result}
                  action={
                    <Button
                      variant={result.isFollowing ? 'secondary' : 'primary'}
                      size="xs"
                      disabled={isSaving}
                      onClick={() => toggleFollow(result)}
                    >
                      {isSaving ? 'Saving...' : result.isFollowing ? 'Following' : 'Follow'}
                    </Button>
                  }
                />
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
