import { useEffect, useState } from 'react';
import { api, getErrorMessage, isAbortError } from '../api/client';
import { Button } from '../components/Button';
import { ErrorMessage } from '../components/ErrorMessage';
import { FeedActivityItem } from '../components/FeedActivityItem';
import { Layout } from '../components/Layout';
import { Text } from '../components/Text';
import { FeedPage as FeedPageData } from '../types';

interface FeedState extends FeedPageData {
  loaded: boolean;
  error: string;
}

const INITIAL_STATE: FeedState = {
  items: [],
  nextCursor: null,
  hasFollowing: false,
  loaded: false,
  error: '',
};

/** Display followed users' public title and collection activity. */
export function FeedPage() {
  const [feed, setFeed] = useState<FeedState>(INITIAL_STATE);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    api
      .get<FeedPageData>('/feed', { signal: controller.signal })
      .then((page) => {
        if (!controller.signal.aborted) setFeed({ ...page, loaded: true, error: '' });
      })
      .catch((requestError: unknown) => {
        if (controller.signal.aborted || isAbortError(requestError)) return;
        setFeed({
          ...INITIAL_STATE,
          loaded: true,
          error: getErrorMessage(requestError, 'Could not load feed'),
        });
      });
    return () => controller.abort();
  }, []);

  /** Append the next cursor page without duplicating existing activities. */
  async function loadMore() {
    if (feed.nextCursor === null || loadingMore) return;
    setLoadingMore(true);
    try {
      const page = await api.get<FeedPageData>(`/feed?cursor=${feed.nextCursor}`);
      setFeed((current) => {
        const ids = new Set(current.items.map(({ id }) => id));
        return {
          ...current,
          items: [...current.items, ...page.items.filter(({ id }) => !ids.has(id))],
          nextCursor: page.nextCursor,
          hasFollowing: page.hasFollowing,
          error: '',
        };
      });
    } catch (requestError) {
      setFeed((current) => ({
        ...current,
        error: getErrorMessage(requestError, 'Could not load more activity'),
      }));
    } finally {
      setLoadingMore(false);
    }
  }

  return (
    <Layout>
      <div className="mx-auto w-full max-w-2xl space-y-6">
        <Text as="h1" variant="heading" size="2xl">
          Feed
        </Text>

        {!feed.loaded ? (
          <Text color="subtle">Loading...</Text>
        ) : feed.error && feed.items.length === 0 ? (
          <ErrorMessage>{feed.error}</ErrorMessage>
        ) : feed.items.length === 0 ? (
          <Text color="subtle">
            {feed.hasFollowing
              ? 'No recent activity from people you follow.'
              : 'Follow people from their profiles to see their activity here.'}
          </Text>
        ) : (
          <div>
            {feed.error && <ErrorMessage>{feed.error}</ErrorMessage>}
            <div>
              {feed.items.map((activity) => (
                <FeedActivityItem key={activity.id} activity={activity} />
              ))}
            </div>
            {feed.nextCursor !== null && (
              <div className="pt-6 text-center">
                <Button variant="secondary" disabled={loadingMore} onClick={loadMore}>
                  {loadingMore ? 'Loading...' : 'Load more'}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
