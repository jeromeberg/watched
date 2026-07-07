import { useParams, useLocation, Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { Detail } from '../components/Detail';
import { useAuth } from '../context/AuthContext';
import { MediaType, MEDIA } from '../types';
import { ProfileHeader } from '../components/ProfileHeader';
import { buttonClasses } from '../components/Button';
import { textClasses } from '../components/Text';

export function DetailPage({ type }: { type: MediaType }) {
  const { username, id } = useParams<{ username?: string; id: string }>();
  const location = useLocation();
  const { user } = useAuth();
  const isOtherUser = !!username && username !== user?.username;
  const from = (location.state as { from?: string } | null)?.from;
  const listPath = from ?? (username ? `/u/${username}/${MEDIA[type].path}` : `/${MEDIA[type].path}`);

  return (
    <Layout>
      <main className="max-w-3xl mx-auto px-6 py-8 space-y-8">
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
        <div>
          <Link to={listPath} className={textClasses('link', 'sm', 'subtle')}>
            Go back
          </Link>
        </div>
        <Detail type={type} id={id!} username={username} />
      </main>
    </Layout>
  );
}
