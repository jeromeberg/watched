import { ActivityType } from '@prisma/client';

export type ActivitySubject = 'title' | 'collection' | 'collectionItem';

interface ActivityPolicyEntry {
  record: boolean;
  show: boolean;
  subject: ActivitySubject;
}

export const ACTIVITY_POLICY: Record<ActivityType, ActivityPolicyEntry> = {
  [ActivityType.TITLE_ADDED]: { record: true, show: true, subject: 'title' },
  [ActivityType.TITLE_STATUS_CHANGED]: { record: true, show: true, subject: 'title' },
  [ActivityType.TITLE_RATING_CHANGED]: { record: true, show: true, subject: 'title' },
  [ActivityType.TITLE_NOTE_CHANGED]: { record: true, show: true, subject: 'title' },
  [ActivityType.COLLECTION_CREATED]: { record: true, show: true, subject: 'collection' },
  [ActivityType.COLLECTION_UPDATED]: { record: false, show: false, subject: 'collection' },
  [ActivityType.COLLECTION_ITEM_ADDED]: { record: true, show: true, subject: 'collectionItem' },
  [ActivityType.COLLECTION_ITEM_REMOVED]: { record: false, show: false, subject: 'collectionItem' },
};

/** Return enabled activity types for one feed subject. */
export function shownActivityTypes(subject: ActivitySubject): ActivityType[] {
  return (Object.entries(ACTIVITY_POLICY) as [ActivityType, ActivityPolicyEntry][])
    .filter(([, policy]) => policy.show && policy.subject === subject)
    .map(([type]) => type);
}
