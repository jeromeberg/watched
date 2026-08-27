import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { LibraryTitle, MEDIA, MediaType, WatchStatus } from '../types';

export type TitleUpdates = Partial<Pick<LibraryTitle, 'rating' | 'status' | 'notes'>>;

interface UseTitleDetailOptions {
  type: MediaType;
  id: string | number;
  username?: string;
  isOtherUser: boolean;
  onUpdate?: (id: number, updates: TitleUpdates) => void;
  onRemove?: (id: number) => void;
}

/** Load one library title and manage its persisted user fields. */
export function useTitleDetail({
  type,
  id,
  username,
  isOtherUser,
  onUpdate,
  onRemove,
}: UseTitleDetailOptions) {
  const titleId = Number(id);
  const basePath = isOtherUser
    ? `/users/${username}/${MEDIA[type].path}/${id}`
    : `/${MEDIA[type].path}/${id}`;
  const [title, setTitle] = useState<LibraryTitle | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [savingStatus, setSavingStatus] = useState(false);
  const [savingRating, setSavingRating] = useState(false);

  useEffect(() => {
    setNotFound(false);
    setTitle(null);
    api
      .get<LibraryTitle | null>(basePath)
      .then((titleData) => {
        if (!titleData) {
          setNotFound(true);
          return;
        }
        setTitle(titleData);
      })
      .catch(() => setNotFound(true));
  }, [basePath]);

  async function updateTitle(updates: TitleUpdates) {
    await api.patch(`/titles/${titleId}`, updates);
    setTitle((previous) => (previous ? { ...previous, ...updates } : previous));
    onUpdate?.(titleId, updates);
  }

  async function updateStatus(status: WatchStatus) {
    if (status === title?.status) return;
    setSavingStatus(true);
    try {
      await updateTitle({ status });
    } finally {
      setSavingStatus(false);
    }
  }

  async function updateRating(rating: number | null) {
    setSavingRating(true);
    try {
      await updateTitle({ rating });
    } finally {
      setSavingRating(false);
    }
  }

  async function updateNotes(notes: string | null): Promise<boolean> {
    if (notes === title?.notes) return false;
    await updateTitle({ notes });
    return true;
  }

  async function deleteTitle() {
    await api.delete(`/titles/${titleId}`);
    onRemove?.(titleId);
  }

  return {
    title,
    notFound,
    savingStatus,
    savingRating,
    updateStatus,
    updateRating,
    updateNotes,
    deleteTitle,
  };
}
