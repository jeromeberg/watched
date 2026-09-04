import { Link } from 'react-router-dom';
import { FeedActivity, mediaTypeOf } from '../types';
import { activityCopy, relativeActivityTime } from '../utils/feedPresentation';
import { SmallPoster } from './Poster';
import { Text, textClasses } from './Text';

/** Return the public detail path for a feed title. */
function titlePath(activity: FeedActivity): string {
  if (!activity.title) return '#';
  const media = mediaTypeOf(activity.title.type);
  return `/u/${activity.actor.username}/${media === 'movie' ? 'movies' : 'shows'}/${activity.title.id}`;
}

/** Render one chronological activity with links to its public subjects. */
export function FeedActivityItem({ activity }: { activity: FeedActivity }) {
  const copy = activityCopy(activity.type, activity.payload);
  const profilePath = `/u/${activity.actor.username}`;
  const collectionPath = activity.collection
    ? `/u/${activity.actor.username}/collections/${activity.collection.id}`
    : '#';
  const note = activity.type === 'TITLE_NOTE_CHANGED' ? activity.payload?.notes : null;

  return (
    <article className="flex gap-4 border-b border-gray-800 py-5 first:pt-0">
      {activity.title && (
        <Link
          to={titlePath(activity)}
          state={{ from: '/' }}
          className="shrink-0"
          aria-label={activity.title.title}
        >
          <SmallPoster title={activity.title} />
        </Link>
      )}

      <div className="min-w-0 flex-1 space-y-2">
        <Text color="muted" className="leading-relaxed">
          <Link to={profilePath} className={textClasses('link', 'sm', 'white', 'font-medium')}>
            {activity.actor.username}
          </Link>{' '}
          {copy.leading}{' '}
          {(copy.target === 'title' || copy.target === 'titleAndCollection') && activity.title && (
            <Link
              to={titlePath(activity)}
              state={{ from: '/' }}
              className={textClasses('link', 'sm', 'white', 'font-medium')}
            >
              {activity.title.title}
            </Link>
          )}
          {copy.target === 'collection' && activity.collection && (
            <Link to={collectionPath} className={textClasses('link', 'sm', 'white', 'font-medium')}>
              {activity.collection.name}
            </Link>
          )}
          {copy.trailing && ` ${copy.trailing}`}
          {copy.target === 'titleAndCollection' && activity.collection && (
            <>
              {' '}
              {copy.collectionConnector}{' '}
              <Link to={collectionPath} className={textClasses('link', 'sm', 'white', 'font-medium')}>
                {activity.collection.name}
              </Link>
            </>
          )}
        </Text>

        {typeof note === 'string' && note.trim() && (
          <Text color="white" className="rounded-lg bg-gray-800 px-3 py-2 whitespace-pre-wrap">
            {note}
          </Text>
        )}

        <time className={textClasses('body', 'xs', 'faint')} dateTime={activity.createdAt}>
          {relativeActivityTime(activity.createdAt)}
        </time>
      </div>
    </article>
  );
}
