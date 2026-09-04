import { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { CollectionFormModal } from '../components/CollectionFormModal';
import { CollectionsGrid } from '../components/CollectionsGrid';
import { CollectionSummary, Visibility } from '../types';
import { api } from '../api/client';
import { Button } from '../components/Button';
import { ErrorMessage } from '../components/ErrorMessage';
import { Text } from '../components/Text';
import { getErrorMessage, isAbortError } from '../api/client';

export function CollectionsPage() {
  const [collections, setCollections] = useState<CollectionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    api
      .get<CollectionSummary[]>('/collections', { signal: controller.signal })
      .then((loadedCollections) => {
        if (!controller.signal.aborted) {
          setCollections(loadedCollections);
          setLoading(false);
        }
      })
      .catch((requestError: unknown) => {
        if (controller.signal.aborted) return;
        if (!isAbortError(requestError)) {
          setError(getErrorMessage(requestError, 'Could not load collections'));
          setLoading(false);
        }
      });
    return () => controller.abort();
  }, []);

  async function handleCreate(name: string, description: string, visibility: Visibility) {
    const created = await api.post<{
      id: number;
      name: string;
      description: string | null;
      visibility: Visibility;
    }>('/collections', { name, description, visibility });
    setCollections((prev) => [{ ...created, itemCount: 0, coverPosters: [] }, ...prev]);
  }

  return (
    <Layout>
      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <Text as="h2" variant="heading" size="2xl">
            Collections
          </Text>
          <Button variant="primary" size="md" onClick={() => setShowForm(true)}>
            + New collection
          </Button>
        </div>

        {loading ? (
          <Text color="subtle">Loading...</Text>
        ) : error ? (
          <ErrorMessage>{error}</ErrorMessage>
        ) : collections.length === 0 ? (
          <Text color="subtle">No collections yet. Create one to organise your library.</Text>
        ) : (
          <CollectionsGrid collections={collections} basePath="/collections" />
        )}
      </main>

      {showForm && (
        <CollectionFormModal
          heading="New collection"
          onSubmit={handleCreate}
          onClose={() => setShowForm(false)}
        />
      )}
    </Layout>
  );
}
