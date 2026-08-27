import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { Titles } from '../components/Titles';
import { TitlesSearch } from '../components/TitlesSearch';
import { ProfileHeader } from '../components/ProfileHeader';
import { DeleteModal } from '../components/DeleteModal';
import { buttonClasses } from '../components/Button';
import { ErrorMessage } from '../components/ErrorMessage';
import { Text } from '../components/Text';
import { TitleUpdates } from '../hooks/useTitleDetail';
import { LibraryTitle, MediaType, MEDIA } from '../types';
import { api, getErrorMessage, isAbortError } from '../api/client';
import { useAuth } from '../context/AuthContext';

interface TitlesReadState {
  key: string;
  titles: LibraryTitle[];
  error: string;
}

export function TitlesPage({ type }: { type: MediaType }) {
  const { username } = useParams<{ username: string }>();
  const { user } = useAuth();
  const isOtherUser = !!username && username !== user?.username;
  const basePath = username ? `/u/${username}/${MEDIA[type].path}` : `/${MEDIA[type].path}`;
  const requestPath = isOtherUser ? `/users/${username}/${MEDIA[type].path}` : `/${MEDIA[type].path}`;
  const [readState, setReadState] = useState<TitlesReadState>({ key: '', titles: [], error: '' });
  const [pendingRemove, setPendingRemove] = useState<{ key: string; title: LibraryTitle } | null>(null);
  const loading = readState.key !== requestPath;
  const titles = loading ? [] : readState.titles;
  const error = loading ? '' : readState.error;

  useEffect(() => {
    const controller = new AbortController();
    api
      .get<LibraryTitle[]>(requestPath, { signal: controller.signal })
      .then((loadedTitles) => {
        if (!controller.signal.aborted) {
          setReadState({ key: requestPath, titles: loadedTitles, error: '' });
        }
      })
      .catch((requestError: unknown) => {
        if (controller.signal.aborted) return;
        if (!isAbortError(requestError)) {
          setReadState({
            key: requestPath,
            titles: [],
            error: getErrorMessage(requestError, 'Could not load titles'),
          });
        }
      });
    return () => controller.abort();
  }, [requestPath]);

  function handleTitleUpdate(id: number, updates: TitleUpdates) {
    setReadState((previous) =>
      previous.key === requestPath
        ? {
            ...previous,
            titles: previous.titles.map((title) => (title.id === id ? { ...title, ...updates } : title)),
          }
        : previous,
    );
  }

  function removeFromState(id: number) {
    setReadState((previous) =>
      previous.key === requestPath
        ? { ...previous, titles: previous.titles.filter((title) => title.id !== id) }
        : previous,
    );
  }

  function addToState(title: LibraryTitle) {
    setReadState((previous) =>
      previous.key === requestPath ? { ...previous, titles: [title, ...previous.titles] } : previous,
    );
  }

  async function handleRemove(id: number) {
    await api.delete(`/titles/${id}`);
    removeFromState(id);
  }

  return (
    <Layout>
      {isOtherUser ? (
        <ProfileHeader
          username={username!}
          actions={
            <Link to={`/u/${username}`} className={buttonClasses('secondary')}>
              Show profile
            </Link>
          }
        />
      ) : (
        <TitlesSearch type={type} titles={titles} onAdd={addToState} />
      )}
      {loading ? (
        <Text color="subtle">Loading...</Text>
      ) : error ? (
        <ErrorMessage>{error}</ErrorMessage>
      ) : (
        <Titles
          type={type}
          titles={titles}
          basePath={basePath}
          username={username}
          onRemove={
            isOtherUser
              ? undefined
              : (id) => {
                  const title = titles.find((item) => item.id === id);
                  if (title) setPendingRemove({ key: requestPath, title });
                }
          }
          onRemoved={removeFromState}
          onTitleUpdate={handleTitleUpdate}
        />
      )}

      {pendingRemove?.key === requestPath && (
        <DeleteModal
          heading="Remove title"
          message={`Remove "${pendingRemove.title.title}" from your list? This cannot be undone.`}
          onConfirm={() => handleRemove(pendingRemove.title.id)}
          onClose={() => setPendingRemove(null)}
        />
      )}
    </Layout>
  );
}
