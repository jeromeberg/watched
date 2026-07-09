import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { Titles } from '../components/Titles';
import { TitlesSearch } from '../components/TitlesSearch';
import { ProfileHeader } from '../components/ProfileHeader';
import { buttonClasses } from '../components/Button';
import { Title, MediaType, MEDIA } from '../types';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

export function TitlesPage({ type }: { type: MediaType }) {
  const { username } = useParams<{ username: string }>();
  const { user } = useAuth();
  const [titles, setTitles] = useState<Title[]>([]);
  const isOtherUser = !!username && username !== user?.username;
  const basePath = username ? `/u/${username}/${MEDIA[type].path}` : `/${MEDIA[type].path}`;

  useEffect(() => {
    const path = isOtherUser ? `/users/${username}/${MEDIA[type].path}` : `/${MEDIA[type].path}`;
    api.get<Title[]>(path).then(setTitles).catch(console.error);
  }, [type, username, isOtherUser]);

  function handleTitleUpdate(id: number, updates: Partial<Title>) {
    setTitles((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
  }

  async function handleRemove(id: number) {
    await api.delete(`/titles/${id}`);
    setTitles((prev) => prev.filter((t) => t.id !== id));
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
        onRemove={isOtherUser ? undefined : handleRemove}
        onTitleUpdate={handleTitleUpdate}
      />
    </Layout>
  );
}
