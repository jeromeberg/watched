import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Text, textClasses } from './Text';

export function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();

  const nav = [
    { href: '/movies', label: 'Movies' },
    { href: '/shows', label: 'Shows' },
    { href: '/collections', label: 'Collections' },
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="relative z-50 bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Text as="span" variant="heading" size="xl" className="tracking-tight">
            Watched
          </Text>
          <nav className="flex gap-4">
            {nav.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={
                  pathname.startsWith(link.href)
                    ? `${textClasses('body', 'sm', 'white')} font-medium transition-colors`
                    : textClasses('link', 'sm', 'muted')
                }
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-4">
          {user && (
            <Link
              to={`/u/${user.username}`}
              className={
                pathname.startsWith(`/u/${user.username}`)
                  ? `${textClasses('body', 'sm', 'white')} font-medium transition-colors`
                  : textClasses('link', 'sm', 'muted')
              }
            >
              {user.username}
            </Link>
          )}
          {user ? (
            <Text as="button" variant="link" size="sm" color="muted" onClick={logout}>
              Sign out
            </Text>
          ) : (
            <Link to="/login" className={textClasses('link', 'sm', 'muted')}>
              Sign in
            </Link>
          )}
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-6 py-8 space-y-8">{children}</main>
    </div>
  );
}
