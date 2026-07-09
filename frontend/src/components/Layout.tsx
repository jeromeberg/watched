import { ReactNode, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Text, textClasses } from './Text';

function MenuIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" className="w-5 h-5">
      <path d="M3 5.5h14M3 10h14M3 14.5h14" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" className="w-5 h-5">
      <path d="M5 5l10 10M15 5L5 15" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const nav = [
    { href: '/movies', label: 'Movies' },
    { href: '/shows', label: 'Shows' },
    { href: '/collections', label: 'Collections' },
  ];

  function navLinkClass(href: string) {
    return pathname.startsWith(href)
      ? `${textClasses('body', 'sm', 'white')} font-medium transition-colors`
      : textClasses('link', 'sm', 'muted');
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="relative z-50 bg-gray-900 border-b border-gray-800 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Text as="span" variant="heading" size="xl" className="tracking-tight">
              Watched
            </Text>
            <nav className="hidden sm:flex gap-4">
              {nav.map((link) => (
                <Link key={link.href} to={link.href} className={navLinkClass(link.href)}>
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="hidden sm:flex items-center gap-4">
            {user && (
              <Link to={`/u/${user.username}`} className={navLinkClass(`/u/${user.username}`)}>
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
          <button
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
            className="sm:hidden -mr-2 p-2 text-gray-300 hover:text-white transition-colors"
          >
            {menuOpen ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>

        {menuOpen && (
          <nav className="sm:hidden mt-4 flex flex-col gap-3">
            {nav.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                onClick={() => setMenuOpen(false)}
                className={navLinkClass(link.href)}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-3 border-t border-gray-800 flex items-center justify-between">
              {user && (
                <Link
                  to={`/u/${user.username}`}
                  onClick={() => setMenuOpen(false)}
                  className={navLinkClass(`/u/${user.username}`)}
                >
                  {user.username}
                </Link>
              )}
              {user ? (
                <Text
                  as="button"
                  variant="link"
                  size="sm"
                  color="muted"
                  onClick={() => {
                    setMenuOpen(false);
                    logout();
                  }}
                >
                  Sign out
                </Text>
              ) : (
                <Link to="/login" onClick={() => setMenuOpen(false)} className={textClasses('link', 'sm', 'muted')}>
                  Sign in
                </Link>
              )}
            </div>
          </nav>
        )}
      </header>
      <main className="max-w-5xl mx-auto px-4 py-4 sm:px-6 sm:py-8 space-y-8">{children}</main>
      <footer className="border-t border-gray-800 px-6 py-4">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <Text color="muted">Copyright (c) 2026 Jerome Berg</Text>
          <div className="flex items-center gap-4">
            <a href="https://github.com/jeromeberg/watched" className={textClasses('link', 'sm', 'muted')}>
              Github
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
