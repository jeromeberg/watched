import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ApiError, api, getErrorMessage, isAbortError } from '../api/client';
import { Layout } from '../components/Layout';
import { ErrorMessage } from '../components/ErrorMessage';
import { Text, textClasses } from '../components/Text';
import { FriendUser } from '../types';

export type ConnectionType = 'followers' | 'following';

interface ConnectionsReadState {
  key: string;
  users: FriendUser[];
  notFound: boolean;
  error: string;
}

interface ConnectionsPageProps {
  type: ConnectionType;
}

/** Display one profile's followers or followed users as a navigable page. */
export function ConnectionsPage({ type }: ConnectionsPageProps) {
  const { username } = useParams<{ username: string }>();
  const profileUsername = username ?? '__missing-profile__';
  const requestKey = `${profileUsername}:${type}`;
  const [readState, setReadState] = useState<ConnectionsReadState>({
    key: '',
    users: [],
    notFound: false,
    error: '',
  });

  useEffect(() => {
    const controller = new AbortController();
    api
      .get<FriendUser[]>(`/users/${profileUsername}/${type}`, { signal: controller.signal })
      .then((users) => {
        if (!controller.signal.aborted) {
          setReadState({ key: requestKey, users, notFound: false, error: '' });
        }
      })
      .catch((requestError: unknown) => {
        if (controller.signal.aborted || isAbortError(requestError)) return;
        if (requestError instanceof ApiError && requestError.status === 404) {
          setReadState({ key: requestKey, users: [], notFound: true, error: '' });
          return;
        }
        setReadState({
          key: requestKey,
          users: [],
          notFound: false,
          error: getErrorMessage(requestError, `Could not load ${type}`),
        });
      });

    return () => controller.abort();
  }, [profileUsername, requestKey, type]);

  const loading = readState.key !== requestKey;
  const label = type === 'followers' ? 'Followers' : 'Following';

  return (
    <Layout>
      <div className="max-w-2xl space-y-6">
        <div className="space-y-2">
          <Link to={`/u/${profileUsername}`} className={textClasses('link', 'sm', 'muted')}>
            Back to {profileUsername}
          </Link>
          <Text as="h1" variant="heading" size="2xl">
            {label}
          </Text>
        </div>

        {loading ? (
          <Text color="subtle">Loading...</Text>
        ) : readState.notFound ? (
          <ErrorMessage>User not found</ErrorMessage>
        ) : readState.error ? (
          <ErrorMessage>{readState.error}</ErrorMessage>
        ) : readState.users.length === 0 ? (
          <Text color="faint">No {type} yet.</Text>
        ) : (
          <div className="divide-y divide-gray-800 border-y border-gray-800">
            {readState.users.map((connection) => (
              <Link
                key={connection.username}
                to={`/u/${connection.username}`}
                className="flex items-center gap-4 py-4 hover:bg-gray-800/40 transition-colors"
              >
                <div className="w-11 h-11 shrink-0 rounded-full bg-blue-600 flex items-center justify-center font-bold">
                  {connection.username[0].toUpperCase()}
                </div>
                <div className="min-w-0">
                  <Text variant="heading">{connection.username}</Text>
                  {connection.bio && (
                    <Text color="muted" className="mt-1 truncate">
                      {connection.bio}
                    </Text>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
