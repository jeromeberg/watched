import { useEffect, useState } from 'react';
import { ApiError, api, getErrorMessage, isAbortError } from '../api/client';
import { LibraryTitle, MEDIA, MediaType, Visibility, WatchStatus } from '../types';

export type TitleUpdates = Partial<Pick<LibraryTitle, 'rating' | 'status' | 'notes' | 'visibility'>>;

interface UseTitleDetailOptions {
  type: MediaType;
  id: string | number;
  username?: string;
  isOtherUser: boolean;
  onUpdate?: (id: number, updates: TitleUpdates) => void;
  onRemove?: (id: number) => void;
}

interface TitleReadState {
  key: string;
  title: LibraryTitle | null;
  notFound: boolean;
  error: string;
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
  const [readState, setReadState] = useState<TitleReadState>({
    key: '',
    title: null,
    notFound: false,
    error: '',
  });
  const [mutationFailure, setMutationFailure] = useState<{ key: string; message: string } | null>(null);
  const [savingStatusFor, setSavingStatusFor] = useState<string | null>(null);
  const [savingRatingFor, setSavingRatingFor] = useState<string | null>(null);
  const [savingVisibilityFor, setSavingVisibilityFor] = useState<string | null>(null);
  const loading = readState.key !== basePath;
  const title = loading ? null : readState.title;
  const notFound = !loading && readState.notFound;
  const loadError = loading ? '' : readState.error;
  const mutationError = mutationFailure?.key === basePath ? mutationFailure.message : '';
  const savingStatus = savingStatusFor === basePath;
  const savingRating = savingRatingFor === basePath;
  const savingVisibility = savingVisibilityFor === basePath;

  useEffect(() => {
    const controller = new AbortController();
    api
      .get<LibraryTitle | null>(basePath, { signal: controller.signal })
      .then((titleData) => {
        if (controller.signal.aborted) return;
        if (!titleData) {
          setReadState({ key: basePath, title: null, notFound: true, error: '' });
          return;
        }
        setReadState({ key: basePath, title: titleData, notFound: false, error: '' });
      })
      .catch((requestError: unknown) => {
        if (controller.signal.aborted) return;
        if (isAbortError(requestError)) return;
        if (requestError instanceof ApiError && requestError.status === 404) {
          setReadState({ key: basePath, title: null, notFound: true, error: '' });
          return;
        }
        setReadState({
          key: basePath,
          title: null,
          notFound: false,
          error: getErrorMessage(requestError, 'Could not load title'),
        });
      });
    return () => controller.abort();
  }, [basePath]);

  async function updateTitle(updates: TitleUpdates) {
    const mutationKey = basePath;
    setMutationFailure(null);
    try {
      await api.patch(`/titles/${titleId}`, updates);
      setReadState((previous) =>
        previous.key === mutationKey && previous.title
          ? { ...previous, title: { ...previous.title, ...updates } }
          : previous,
      );
      onUpdate?.(titleId, updates);
    } catch (error) {
      setMutationFailure({ key: mutationKey, message: getErrorMessage(error, 'Could not update title') });
      throw error;
    }
  }

  async function updateStatus(status: WatchStatus) {
    if (status === title?.status) return;
    const mutationKey = basePath;
    setSavingStatusFor(mutationKey);
    try {
      await updateTitle({ status });
    } catch {
      return;
    } finally {
      setSavingStatusFor((current) => (current === mutationKey ? null : current));
    }
  }

  async function updateRating(rating: number | null) {
    const mutationKey = basePath;
    setSavingRatingFor(mutationKey);
    try {
      await updateTitle({ rating });
    } catch {
      return;
    } finally {
      setSavingRatingFor((current) => (current === mutationKey ? null : current));
    }
  }

  /** Persist one library item's visibility. */
  async function updateVisibility(visibility: Visibility) {
    if (visibility === title?.visibility) return;
    const mutationKey = basePath;
    setSavingVisibilityFor(mutationKey);
    try {
      await updateTitle({ visibility });
    } catch {
      return;
    } finally {
      setSavingVisibilityFor((current) => (current === mutationKey ? null : current));
    }
  }

  async function updateNotes(notes: string | null): Promise<boolean> {
    if (notes === title?.notes) return false;
    try {
      await updateTitle({ notes });
      return true;
    } catch {
      return false;
    }
  }

  async function deleteTitle() {
    const mutationKey = basePath;
    setMutationFailure(null);
    try {
      await api.delete(`/titles/${titleId}`);
      onRemove?.(titleId);
    } catch (error) {
      setMutationFailure({ key: mutationKey, message: getErrorMessage(error, 'Could not remove title') });
      throw error;
    }
  }

  return {
    title,
    loading,
    notFound,
    loadError,
    mutationError,
    savingStatus,
    savingRating,
    savingVisibility,
    updateStatus,
    updateRating,
    updateVisibility,
    updateNotes,
    deleteTitle,
  };
}
