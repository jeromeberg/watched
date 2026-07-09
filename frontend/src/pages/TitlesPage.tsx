import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { Titles } from '../components/Titles';
import { TitlesSearch } from '../components/TitlesSearch';
import { ProfileHeader } from '../components/ProfileHeader';
import { DeleteModal } from '../components/DeleteModal';
import { buttonClasses } from '../components/Button';
import { Title, MediaType, MEDIA } from '../types';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

export function TitlesPage({ type }: { type: MediaType }) {
  const { username } = useParams<{ username: string }>();
  const { user } = useAuth();
  const [titles, setTitles] = useState<Title[]>([]);
  const [pendingRemove, setPendingRemove] = useState<Title | null>(null);
  const isOtherUser = !!username && username !== user?.username;
  const basePath = username ? `/u/${username}/${MEDIA[type].path}` : `/${MEDIA[type].path}`;

  useEffect(() => {
    const path = isOtherUser ? `/users/${username}/${MEDIA[type].path}` : `/${MEDIA[type].path}`;
    api.get<Title[]>(path).then(setTitles).catch(console.error);
  }, [type, username, isOtherUser]);

  function handleTitleUpdate(id: number, updates: Partial<Title>) {
    setTitles((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
  }

  function removeFromState(id: number) {
    setTitles((prev) => prev.filter((t) => t.id !== id));
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
        <TitlesSearch type={type} titles={titles} onAdd={(title) => setTitles((prev) => [title, ...prev])} />
      )}
      <Titles
        type={type}
        titles={titles}
        basePath={basePath}
        username={username}
        onRemove={isOtherUser ? undefined : (id) => setPendingRemove(titles.find((t) => t.id === id) ?? null)}
        onRemoved={removeFromState}
        onTitleUpdate={handleTitleUpdate}
      />

      {pendingRemove && (
        <DeleteModal
          heading="Remove title"
          message={`Remove "${pendingRemove.title}" from your list? This cannot be undone.`}
          onConfirm={() => handleRemove(pendingRemove.id)}
          onClose={() => setPendingRemove(null)}
        />
      )}
    </Layout>
  );
}
