import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ApiError, api, getErrorMessage, isAbortError } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { PublicProfile, MediaType, MEDIA } from '../types';
import { GridView } from '../components/TitlesViews';
import { Layout } from '../components/Layout';
import { CollectionsGrid } from '../components/CollectionsGrid';
import { ProfilePicks } from '../components/ProfilePicks';
import { ProfileHeader } from '../components/ProfileHeader';
import { TitleDetailModal } from '../components/TitleDetailModal';
import { Button, buttonClasses } from '../components/Button';
import { Text, textClasses } from '../components/Text';
import { Textarea } from '../components/Textarea';
import { ErrorMessage } from '../components/ErrorMessage';

const PROFILE_TITLES_LIMIT = 10;

interface ProfileReadState {
  key: string;
  profile: PublicProfile | null;
  notFound: boolean;
  error: string;
}

interface FollowState {
  key: string;
  isFollowing: boolean;
  saving: boolean;
  error: string;
}

export function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const { user } = useAuth();
  const profileKey = username ?? '__missing-profile__';
  const [readState, setReadState] = useState<ProfileReadState>({
    key: '',
    profile: null,
    notFound: false,
    error: '',
  });
  const [selected, setSelected] = useState<{ key: string; type: MediaType; id: number } | null>(null);
  const [followState, setFollowState] = useState<FollowState>({
    key: '',
    isFollowing: false,
    saving: false,
    error: '',
  });
  const isOwnProfile = user?.username === username;
  const loading = readState.key !== profileKey;
  const profile = loading ? null : readState.profile;
  const notFound = !loading && readState.notFound;
  const error = loading ? '' : readState.error;

  // Inline bio edit mode (own profile only).
  const [editingBioFor, setEditingBioFor] = useState<string | null>(null);
  const [bio, setBio] = useState('');
  const [savingBioFor, setSavingBioFor] = useState<string | null>(null);
  const [bioFailure, setBioFailure] = useState<{ key: string; message: string } | null>(null);
  const editingBio = editingBioFor === profileKey;
  const savingBio = savingBioFor === profileKey;
  const bioError = bioFailure?.key === profileKey ? bioFailure.message : '';

  useEffect(() => {
    const controller = new AbortController();
    api
      .get<PublicProfile>(`/users/${profileKey}/public`, { signal: controller.signal })
      .then((loadedProfile) => {
        if (!controller.signal.aborted) {
          setReadState({ key: profileKey, profile: loadedProfile, notFound: false, error: '' });
        }
      })
      .catch((requestError: unknown) => {
        if (controller.signal.aborted) return;
        if (isAbortError(requestError)) return;
        if (requestError instanceof ApiError && requestError.status === 404) {
          setReadState({ key: profileKey, profile: null, notFound: true, error: '' });
          return;
        }
        setReadState({
          key: profileKey,
          profile: null,
          notFound: false,
          error: getErrorMessage(requestError, 'Could not load profile'),
        });
      });
    return () => controller.abort();
  }, [profileKey]);

  useEffect(() => {
    if (!user || isOwnProfile) return;

    const controller = new AbortController();
    api
      .get<{ isFollowing: boolean }>(`/users/${profileKey}/follow-status`, { signal: controller.signal })
      .then(({ isFollowing }) => {
        if (!controller.signal.aborted) {
          setFollowState({ key: profileKey, isFollowing, saving: false, error: '' });
        }
      })
      .catch((requestError: unknown) => {
        if (controller.signal.aborted || isAbortError(requestError)) return;
        setFollowState({
          key: profileKey,
          isFollowing: false,
          saving: false,
          error: getErrorMessage(requestError, 'Could not load follow status'),
        });
      });

    return () => controller.abort();
  }, [isOwnProfile, profileKey, user]);

  function startEditingBio() {
    if (!profile) return;
    setBio(profile.bio ?? '');
    setBioFailure(null);
    setEditingBioFor(profileKey);
  }

  async function handleSaveBio() {
    const mutationKey = profileKey;
    setSavingBioFor(mutationKey);
    setBioFailure(null);
    try {
      const newBio = bio.trim() || null;
      await api.patch('/me/profile', { bio: newBio });
      setReadState((previous) =>
        previous.key === mutationKey && previous.profile
          ? { ...previous, profile: { ...previous.profile, bio: newBio } }
          : previous,
      );
      setEditingBioFor(null);
    } catch (err) {
      setBioFailure({ key: mutationKey, message: getErrorMessage(err, 'Could not save bio') });
    } finally {
      setSavingBioFor((current) => (current === mutationKey ? null : current));
    }
  }

  /** Toggle the current user's follow relation and update the visible count. */
  async function handleToggleFollow() {
    if (!user || isOwnProfile || followState.key !== profileKey || followState.saving) return;

    const wasFollowing = followState.isFollowing;
    setFollowState((previous) => ({ ...previous, saving: true, error: '' }));
    try {
      if (wasFollowing) {
        await api.delete(`/users/${profileKey}/follow`);
      } else {
        await api.post(`/users/${profileKey}/follow`, {});
      }

      setFollowState({ key: profileKey, isFollowing: !wasFollowing, saving: false, error: '' });
      setReadState((previous) =>
        previous.key === profileKey && previous.profile
          ? {
              ...previous,
              profile: {
                ...previous.profile,
                followersCount: Math.max(0, previous.profile.followersCount + (wasFollowing ? -1 : 1)),
              },
            }
          : previous,
      );
    } catch (requestError) {
      setFollowState({
        key: profileKey,
        isFollowing: wasFollowing,
        saving: false,
        error: getErrorMessage(
          requestError,
          wasFollowing ? 'Could not unfollow user' : 'Could not follow user',
        ),
      });
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <Text color="subtle">Loading...</Text>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <Layout>
        <ErrorMessage>{error || 'Could not load profile'}</ErrorMessage>
      </Layout>
    );
  }

  const displayedMovies = profile.movies.slice(0, PROFILE_TITLES_LIMIT);
  const displayedShows = profile.shows.slice(0, PROFILE_TITLES_LIMIT);
  const followLoading = !!user && !isOwnProfile && followState.key !== profileKey;

  return (
    <Layout>
      <div className="space-y-12">
        <ProfileHeader
          username={profile.username}
          bio={editingBio ? undefined : profile.bio}
          isOwnProfile={isOwnProfile}
          stats={
            <div className="flex gap-4">
              <Link to={`/u/${profile.username}/followers`} className={textClasses('link', 'sm', 'muted')}>
                <span className="font-semibold text-white">{profile.followersCount}</span>{' '}
                {profile.followersCount === 1 ? 'follower' : 'followers'}
              </Link>
              <Link to={`/u/${profile.username}/following`} className={textClasses('link', 'sm', 'muted')}>
                <span className="font-semibold text-white">{profile.followingCount}</span> following
              </Link>
            </div>
          }
          actions={
            isOwnProfile && !editingBio ? (
              <Button variant="secondary" onClick={startEditingBio}>
                Edit bio
              </Button>
            ) : !isOwnProfile && user ? (
              <div className="flex flex-col items-end gap-2">
                <Button
                  variant={followState.isFollowing ? 'secondary' : 'primary'}
                  onClick={handleToggleFollow}
                  disabled={followLoading || followState.saving || !!followState.error}
                >
                  {followLoading
                    ? 'Loading...'
                    : followState.saving
                      ? 'Saving...'
                      : followState.isFollowing
                        ? 'Unfollow'
                        : 'Follow'}
                </Button>
                {followState.key === profileKey && followState.error && (
                  <Text color="danger" size="xs">
                    {followState.error}
                  </Text>
                )}
              </div>
            ) : !isOwnProfile ? (
              <Link to="/login" className={buttonClasses('primary')}>
                Follow
              </Link>
            ) : null
          }
        >
          {editingBio && (
            <div className="space-y-2">
              {bioError && <ErrorMessage>{bioError}</ErrorMessage>}
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
                  <Button variant="ghost" onClick={() => setEditingBioFor(null)}>
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

        {isOwnProfile && (
          <div>
            <Link to="/settings" className={buttonClasses('secondary')}>
              Account settings
            </Link>
          </div>
        )}

        {/* Picks */}
        <ProfilePicks
          username={username!}
          topPicks={profile.topPicks}
          isOwnProfile={isOwnProfile}
          onSaved={(topPicks) =>
            setReadState((previous) =>
              previous.key === profileKey && previous.profile
                ? { ...previous, profile: { ...previous.profile, topPicks } }
                : previous,
            )
          }
        />

        {/* Movies */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <Text as="h2" variant="label">
              🎬 Movies
            </Text>
            <Link to={`/u/${profile.username}/movies`} className={textClasses('link', 'xs', 'muted')}>
              ↗ View all
            </Link>
          </div>

          {displayedMovies.length > 0 ? (
            <GridView
              type="movie"
              titles={displayedMovies}
              basePath={`/u/${profile.username}/movies`}
              onSelect={(t) => setSelected({ key: profileKey, type: 'movie', id: t.id })}
            />
          ) : (
            <Text color="faint">No watched movies yet...</Text>
          )}
        </section>

        {/* Shows */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <Text as="h2" variant="label">
              📺 Shows
            </Text>
            <Link to={`/u/${profile.username}/shows`} className={textClasses('link', 'xs', 'muted')}>
              ↗ View all
            </Link>
          </div>

          {displayedShows.length > 0 ? (
            <GridView
              type="show"
              titles={displayedShows}
              basePath={`/u/${profile.username}/shows`}
              onSelect={(t) => setSelected({ key: profileKey, type: 'show', id: t.id })}
            />
          ) : (
            <Text color="faint">No watched TV shows yet...</Text>
          )}
        </section>

        {/* Collections */}
        <section className="space-y-4">
          <Text as="h2" variant="label">
            📚 Collections
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

      {/* Modal */}
      {selected?.key === profileKey && (
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
