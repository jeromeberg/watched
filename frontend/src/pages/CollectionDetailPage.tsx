import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { ProfileHeader } from '../components/ProfileHeader';
import { CollectionFormModal } from '../components/CollectionFormModal';
import { AddTitleModal } from '../components/AddTitleModal';
import { DeleteModal } from '../components/DeleteModal';
import { Button, buttonClasses } from '../components/Button';
import { Text, textClasses } from '../components/Text';
import { Titles } from '../components/Titles';
import { useAuth } from '../context/AuthContext';
import { CollectionDetail, Title } from '../types';
import { api } from '../api/client';

export function CollectionDetailPage() {
  const { username, id } = useParams<{ username?: string; id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isOtherUser = !!username && username !== user?.username;
  const basePath = isOtherUser ? `/users/${username}/collections/${id}` : `/collections/${id}`;
  const moviesPath = isOtherUser ? `/u/${username}/movies` : '/movies';
  const showsPath = isOtherUser ? `/u/${username}/shows` : '/shows';
  const [collection, setCollection] = useState<CollectionDetail | null>(null);
  const [showEdit, setShowEdit] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [pendingRemoveItem, setPendingRemoveItem] = useState<Title | null>(null);

  useEffect(() => {
    api.get<CollectionDetail>(basePath).then(setCollection).catch(console.error);
  }, [basePath]);

  async function handleEdit(name: string, description: string) {
    const updated = await api.patch<CollectionDetail>(`/collections/${id}`, { name, description });
    setCollection((prev) =>
      prev ? { ...prev, name: updated.name, description: updated.description } : prev,
    );
  }

  async function handleDelete() {
    await api.delete(`/collections/${id}`);
    navigate('/collections');
  }

  function handleTitleUpdate(id: number, updates: Partial<Title>) {
    setCollection((prev) =>
      prev
        ? {
            ...prev,
            items: prev.items.map((i) => (i.titleId === id ? { ...i, title: { ...i.title, ...updates } } : i)),
          }
        : prev,
    );
  }

  function handleItemAdded(title: Title) {
    setCollection((prev) =>
      prev
        ? {
            ...prev,
            items: [
              ...prev.items,
              { collectionId: prev.id, titleId: title.id, addedAt: new Date().toISOString(), title },
            ],
          }
        : prev,
    );
  }

  function handleItemRemoved(titleId: number) {
    setCollection((prev) =>
      prev ? { ...prev, items: prev.items.filter((i) => i.titleId !== titleId) } : prev,
    );
  }

  async function handleRemoveItem(titleId: number) {
    await api.delete(`/collections/${id}/items/${titleId}`);
    handleItemRemoved(titleId);
  }

  if (!collection) {
    return (
      <Layout>
        <main className="max-w-5xl mx-auto px-6 py-8">
          <Text color="subtle">Loading...</Text>
        </main>
      </Layout>
    );
  }

  const titles = collection.items.map((i) => ({ ...i.title, addedAt: i.addedAt }));

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
              isOtherUser
                ? undefined
                : (id) => setPendingRemoveItem(titles.find((t) => t.id === id) ?? null)
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
