import { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { CollectionFormModal } from '../components/CollectionFormModal';
import { CollectionsGrid } from '../components/CollectionsGrid';
import { CollectionSummary } from '../types';
import { api } from '../api/client';
import { Button } from '../components/Button';
import { Text } from '../components/Text';

export function CollectionsPage() {
  const [collections, setCollections] = useState<CollectionSummary[]>([]);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    api.get<CollectionSummary[]>('/collections').then(setCollections).catch(console.error);
  }, []);

  async function handleCreate(name: string, description: string) {
    const created = await api.post<{ id: number; name: string; description: string | null }>('/collections', {
      name,
      description,
    });
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

        {collections.length === 0 ? (
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
