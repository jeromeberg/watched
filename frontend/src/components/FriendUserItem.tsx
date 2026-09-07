import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { FriendUser } from '../types';
import { Text } from './Text';

interface FriendUserItemProps {
  user: FriendUser;
  action?: ReactNode;
}

/** Display a compact profile row with an optional action. */
export function FriendUserItem({ user, action }: FriendUserItemProps) {
  return (
    <div className="flex items-center gap-4 px-2 py-4 hover:bg-gray-800/40 transition-colors">
      <Link to={`/u/${user.username}`} className="flex min-w-0 flex-1 items-center gap-4">
        <div className="w-11 h-11 shrink-0 rounded-full bg-blue-600 flex items-center justify-center font-bold">
          {user.username[0].toUpperCase()}
        </div>
        <div className="min-w-0">
          <Text variant="heading">{user.username}</Text>
          {user.bio && (
            <Text color="muted" className="mt-1 truncate">
              {user.bio}
            </Text>
          )}
        </div>
      </Link>
      {action}
    </div>
  );
}
