import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { PublicProfile, MediaType, MEDIA } from '../types';
import { GridView } from '../components/TitlesViews';
import { Layout } from '../components/Layout';
import { CollectionsGrid } from '../components/CollectionsGrid';
import { ProfilePicks } from '../components/ProfilePicks';
import { ProfileHeader } from '../components/ProfileHeader';
import { TitleDetailModal } from '../components/TitleDetailModal';
import { Button } from '../components/Button';
import { Text, textClasses } from '../components/Text';
import { Textarea } from '../components/Textarea';

const PROFILE_TITLES_LIMIT = 10;

export function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const { user } = useAuth();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [selected, setSelected] = useState<{ type: MediaType; id: number } | null>(null);
  const isOwnProfile = user?.username === username;

  // Inline bio edit mode (own profile only).
  const [editingBio, setEditingBio] = useState(false);
  const [bio, setBio] = useState('');
  const [savingBio, setSavingBio] = useState(false);

  useEffect(() => {
    setEditingBio(false);
    api
      .get<PublicProfile>(`/users/${username}/public`)
      .then(setProfile)
      .catch(() => setNotFound(true));
  }, [username]);

  function startEditingBio() {
    if (!profile) return;
    setBio(profile.bio ?? '');
    setEditingBio(true);
  }

  async function handleSaveBio() {
    setSavingBio(true);
    try {
      const newBio = bio.trim() || null;
      await api.patch('/me/profile', { bio: newBio });
      setProfile((prev) => (prev ? { ...prev, bio: newBio } : prev));
      setEditingBio(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSavingBio(false);
    }
  }

  if (notFound) {
    return (
      <Layout>
        <div className="text-center">
          <Text variant="heading" size="2xl">
            User not found
          </Text>
          <Link to="/" className={textClasses('link', 'sm', 'accent')}>
            Go home
          </Link>
        </div>
      </Layout>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <Text color="subtle">Loading...</Text>
      </div>
    );
  }

  const displayedMovies = profile.movies.slice(0, PROFILE_TITLES_LIMIT);
  const displayedShows = profile.shows.slice(0, PROFILE_TITLES_LIMIT);

  return (
    <Layout>
      <div className="space-y-12">
        <ProfileHeader
          username={profile.username}
          bio={editingBio ? undefined : profile.bio}
          isOwnProfile={isOwnProfile}
          actions={
            isOwnProfile &&
            !editingBio && (
              <Button variant="secondary" onClick={startEditingBio}>
                Edit bio
              </Button>
            )
          }
        >
          {editingBio && (
            <div className="space-y-2">
              <Textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                maxLength={300}
                placeholder="Tell the world what you watch..."
                autoFocus
              />
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  <Button variant="primary" onClick={handleSaveBio} disabled={savingBio}>
                    {savingBio ? 'Saving...' : 'Save'}
                  </Button>
                  <Button variant="ghost" onClick={() => setEditingBio(false)}>
                    Cancel
                  </Button>
                </div>
                <Text size="xs" color="faint">
                  {bio.length}/300
                </Text>
              </div>
            </div>
          )}
        </ProfileHeader>

        {/* Picks */}
        <ProfilePicks
          username={username!}
          topPicks={profile.topPicks}
          isOwnProfile={isOwnProfile}
          onSaved={(topPicks) => setProfile((prev) => (prev ? { ...prev, topPicks } : prev))}
        />

        {/* Movies */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <Text as="h2" variant="label">
              Movies
            </Text>
            <Link to={`/u/${profile.username}/movies`} className={textClasses('link', 'xs', 'subtle')}>
              View all
            </Link>
          </div>

          {displayedMovies.length > 0 ? (
            <GridView
              type="movie"
              titles={displayedMovies}
              basePath={`/u/${profile.username}/movies`}
              onSelect={(t) => setSelected({ type: 'movie', id: t.id })}
            />
          ) : (
            <Text color="faint">No watched movies yet...</Text>
          )}
        </section>

        {/* Shows */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <Text as="h2" variant="label">
              Shows
            </Text>
            <Link to={`/u/${profile.username}/shows`} className={textClasses('link', 'xs', 'subtle')}>
              View all
            </Link>
          </div>

          {displayedShows.length > 0 ? (
            <GridView
              type="show"
              titles={displayedShows}
              basePath={`/u/${profile.username}/shows`}
              onSelect={(t) => setSelected({ type: 'show', id: t.id })}
            />
          ) : (
            <Text color="faint">No watched TV shows yet...</Text>
          )}
        </section>

        {/* Collections */}
        <section className="space-y-4">
          <Text as="h2" variant="label">
            Collections
          </Text>
          {profile.collections.length > 0 ? (
            <CollectionsGrid
              collections={profile.collections}
              basePath={`/u/${profile.username}/collections`}
            />
          ) : (
            <Text color="faint">No collection yet...</Text>
          )}
        </section>
      </div>

      { /* Modal */ }  
      {selected && (
        <TitleDetailModal
          type={selected.type}
          id={selected.id}
          username={profile.username}
          fullPagePath={`/u/${profile.username}/${MEDIA[selected.type].path}/${selected.id}`}
          returnPath={`/u/${profile.username}`}
          onClose={() => setSelected(null)}
        />
      )}
    </Layout>
  );
}
