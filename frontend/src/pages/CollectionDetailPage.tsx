import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { ProfileHeader } from '../components/ProfileHeader';
import { CollectionFormModal } from '../components/CollectionFormModal';
import { AddTitleModal } from '../components/AddTitleModal';
import { DeleteModal } from '../components/DeleteModal';
import { Button, buttonClasses } from '../components/Button';
import { ErrorMessage } from '../components/ErrorMessage';
import { Text, textClasses } from '../components/Text';
import { Titles } from '../components/Titles';
import { TitleUpdates } from '../hooks/useTitleDetail';
import { useAuth } from '../context/AuthContext';
import { CollectionDetail, CollectionItem, CollectionTitle, LibraryTitle } from '../types';
import { api, getErrorMessage, isAbortError } from '../api/client';

/** Flatten one collection item for the shared library-title list UI. */
function titleListItem(item: CollectionItem): LibraryTitle {
  return { ...item.title, addedAt: item.addedAt };
}

/** Build a collection title without the library relation date. */
function collectionTitleOf(title: LibraryTitle): CollectionTitle {
  const { addedAt, ...collectionTitle } = title;
  void addedAt;
  return collectionTitle;
}

interface CollectionReadState {
  key: string;
  collection: CollectionDetail | null;
  error: string;
}

export function CollectionDetailPage() {
  const { username, id } = useParams<{ username?: string; id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isOtherUser = !!username && username !== user?.username;
  const basePath = isOtherUser ? `/users/${username}/collections/${id}` : `/collections/${id}`;
  const moviesPath = isOtherUser ? `/u/${username}/movies` : '/movies';
  const showsPath = isOtherUser ? `/u/${username}/shows` : '/shows';
  const [readState, setReadState] = useState<CollectionReadState>({
    key: '',
    collection: null,
    error: '',
  });
  const [showEdit, setShowEdit] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [pendingRemoveItem, setPendingRemoveItem] = useState<LibraryTitle | null>(null);
  const loading = readState.key !== basePath;
  const collection = loading ? null : readState.collection;
  const error = loading ? '' : readState.error;

  useEffect(() => {
    const controller = new AbortController();
    api
      .get<CollectionDetail>(basePath, { signal: controller.signal })
      .then((loadedCollection) => {
        if (!controller.signal.aborted) {
          setReadState({ key: basePath, collection: loadedCollection, error: '' });
          setShowEdit(false);
          setShowAdd(false);
          setShowDelete(false);
          setPendingRemoveItem(null);
        }
      })
      .catch((requestError: unknown) => {
        if (controller.signal.aborted) return;
        if (!isAbortError(requestError)) {
          setReadState({
            key: basePath,
            collection: null,
            error: getErrorMessage(requestError, 'Could not load collection'),
          });
        }
      });
    return () => controller.abort();
  }, [basePath]);

  async function handleEdit(name: string, description: string) {
    const updated = await api.patch<Pick<CollectionDetail, 'name' | 'description'>>(`/collections/${id}`, {
      name,
      description,
    });
    setReadState((previous) =>
      previous.key === basePath && previous.collection
        ? {
            ...previous,
            collection: {
              ...previous.collection,
              name: updated.name,
              description: updated.description,
            },
          }
        : previous,
    );
  }

  async function handleDelete() {
    await api.delete(`/collections/${id}`);
    navigate('/collections');
  }

  function handleTitleUpdate(id: number, updates: TitleUpdates) {
    setReadState((previous) =>
      previous.key === basePath && previous.collection
        ? {
            ...previous,
            collection: {
              ...previous.collection,
              items: previous.collection.items.map((item) =>
                item.titleId === id ? { ...item, title: { ...item.title, ...updates } } : item,
              ),
            },
          }
        : previous,
    );
  }

  function handleItemAdded(title: LibraryTitle) {
    setReadState((previous) =>
      previous.key === basePath && previous.collection
        ? {
            ...previous,
            collection: {
              ...previous.collection,
              items: [
                ...previous.collection.items,
                {
                  collectionId: previous.collection.id,
                  titleId: title.id,
                  addedAt: new Date().toISOString(),
                  title: collectionTitleOf(title),
                },
              ],
            },
          }
        : previous,
    );
  }

  function handleItemRemoved(titleId: number) {
    setReadState((previous) =>
      previous.key === basePath && previous.collection
        ? {
            ...previous,
            collection: {
              ...previous.collection,
              items: previous.collection.items.filter((item) => item.titleId !== titleId),
            },
          }
        : previous,
    );
  }

  async function handleRemoveItem(titleId: number) {
    await api.delete(`/collections/${id}/items/${titleId}`);
    handleItemRemoved(titleId);
  }

  if (loading) {
    return (
      <Layout>
        <main className="max-w-5xl mx-auto px-6 py-8">
          <Text color="subtle">Loading...</Text>
        </main>
      </Layout>
    );
  }

  if (error || !collection) {
    return (
      <Layout>
        <main className="max-w-5xl mx-auto px-6 py-8">
          <ErrorMessage>{error || 'Collection not found'}</ErrorMessage>
        </main>
      </Layout>
    );
  }

  const titles = collection.items.map(titleListItem);

  return (
    <Layout>
      <main className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        {isOtherUser && (
          <ProfileHeader
            username={username!}
            actions={
              <Link to={`/u/${username}`} className={buttonClasses('secondary')}>
                Show profile
              </Link>
            }
          />
        )}

        {/* Header */}
        <div>
          {!isOtherUser && (
            <Link to="/collections" className={textClasses('link', 'sm', 'subtle')}>
              Collections
            </Link>
          )}
          <div className="mt-4 flex items-start justify-between gap-4">
            <div>
              <Text as="h2" variant="heading" size="2xl">
                {collection.name}
              </Text>
              {collection.description && (
                <Text color="muted" className="mt-1">
                  {collection.description}
                </Text>
              )}
            </div>
            {!isOtherUser && (
              <div className="flex gap-2 shrink-0">
                <Button variant="primary" onClick={() => setShowAdd(true)}>
                  + Add titles
                </Button>
                <Button variant="secondary" onClick={() => setShowEdit(true)}>
                  Edit
                </Button>
                <Button variant="dangerOutline" onClick={() => setShowDelete(true)}>
                  Delete
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Items */}
        {collection.items.length === 0 ? (
          <div className="text-center py-12 space-y-3">
            <Text color="subtle">No titles in this collection yet.</Text>
            {!isOtherUser && (
              <Button variant="primary" size="md" onClick={() => setShowAdd(true)}>
                + Add titles
              </Button>
            )}
          </div>
        ) : (
          <Titles
            titles={titles}
            basePath={(title) => (title.type === 'MOVIE' ? moviesPath : showsPath)}
            onRemove={
              isOtherUser ? undefined : (id) => setPendingRemoveItem(titles.find((t) => t.id === id) ?? null)
            }
            onRemoved={handleItemRemoved}
            onTitleUpdate={handleTitleUpdate}
            username={username}
          />
        )}
      </main>

      {showEdit && (
        <CollectionFormModal
          heading="Edit collection"
          initial={{ name: collection.name, description: collection.description ?? '' }}
          onSubmit={handleEdit}
          onClose={() => setShowEdit(false)}
        />
      )}

      {showAdd && (
        <AddTitleModal
          collectionId={collection.id}
          existingTitleIds={new Set(collection.items.map((i) => i.titleId))}
          onAdd={handleItemAdded}
          onRemove={handleItemRemoved}
          onClose={() => setShowAdd(false)}
        />
      )}

      {showDelete && (
        <DeleteModal
          heading="Delete collection"
          message="Delete this collection? This cannot be undone."
          onConfirm={handleDelete}
          onClose={() => setShowDelete(false)}
        />
      )}

      {pendingRemoveItem && (
        <DeleteModal
          heading="Remove title"
          message={`Remove "${pendingRemoveItem.title}" from this collection? This cannot be undone.`}
          onConfirm={() => handleRemoveItem(pendingRemoveItem.id)}
          onClose={() => setPendingRemoveItem(null)}
        />
      )}
    </Layout>
  );
}
