import type { ActivityType } from '../types';

export interface ActivityCopy {
  leading: string;
  trailing?: string;
  collectionConnector?: string;
  target: 'title' | 'collection' | 'titleAndCollection';
}

/** Return the text fragments used around linked feed subjects. */
export function activityCopy(type: ActivityType, payload: Record<string, unknown> | null): ActivityCopy {
  switch (type) {
    case 'TITLE_ADDED':
      return { leading: 'added', trailing: 'to their library', target: 'title' };
    case 'TITLE_STATUS_CHANGED':
      return payload?.status === 'WATCHED'
        ? { leading: 'watched', target: 'title' }
        : { leading: 'wants to watch', target: 'title' };
    case 'TITLE_RATING_CHANGED':
      return {
        leading: 'rated',
        trailing: typeof payload?.rating === 'number' ? `${payload.rating}/10` : undefined,
        target: 'title',
      };
    case 'TITLE_NOTE_CHANGED':
      return { leading: 'commented on', target: 'title' };
    case 'COLLECTION_CREATED':
      return { leading: 'created the collection', target: 'collection' };
    case 'COLLECTION_UPDATED':
      return { leading: 'updated the collection', target: 'collection' };
    case 'COLLECTION_ITEM_ADDED':
      return { leading: 'added', collectionConnector: 'to', target: 'titleAndCollection' };
    case 'COLLECTION_ITEM_REMOVED':
      return { leading: 'removed', collectionConnector: 'from', target: 'titleAndCollection' };
  }
}

/** Format an activity timestamp as a compact relative value or calendar date. */
export function relativeActivityTime(value: string, now = Date.now()): string {
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) return '';

  const elapsedSeconds = Math.max(0, Math.floor((now - timestamp) / 1000));
  if (elapsedSeconds < 60) return 'just now';
  const elapsedMinutes = Math.floor(elapsedSeconds / 60);
  if (elapsedMinutes < 60) return `${elapsedMinutes}m`;
  const elapsedHours = Math.floor(elapsedMinutes / 60);
  if (elapsedHours < 24) return `${elapsedHours}h`;
  const elapsedDays = Math.floor(elapsedHours / 24);
  if (elapsedDays < 7) return `${elapsedDays}d`;
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(timestamp);
}
