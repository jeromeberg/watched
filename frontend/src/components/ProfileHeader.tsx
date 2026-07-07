import { ReactNode } from 'react';
import { Text } from './Text';

interface ProfileHeaderProps {
  username: string;
  bio?: string | null;
  isOwnProfile?: boolean;
  actions?: ReactNode;
  children?: ReactNode;
}

export function ProfileHeader({ username, bio, isOwnProfile, actions, children }: ProfileHeaderProps) {
  return (
    <div className="space-y-3">
      <div className="w-14 h-14 rounded-full bg-blue-600 flex items-center justify-center text-xl font-bold">
        {username[0].toUpperCase()}
      </div>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <Text as="h1" variant="heading" size="2xl">
            {username}
          </Text>
          {bio ? (
            <Text color="muted" size="base" className="mt-2 max-w-xl">
              {bio}
            </Text>
          ) : bio === null && isOwnProfile ? (
            <Text color="faint" className="mt-2">
              Add a bio...
            </Text>
          ) : null}
        </div>
        {actions && <div className="shrink-0">{actions}</div>}
      </div>
      {children}
    </div>
  );
}
