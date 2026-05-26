'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { removeToken } from '@/lib/auth';
import { useAuth } from '@/lib/use-auth';

/** "hiaisha" wordmark — the i gets a turmeric dot */
function HiaishaLogo() {
  return (
    <span
      className="inline-flex items-baseline gap-0 font-display font-extrabold tracking-tight leading-none select-none"
      style={{ fontSize: 22, letterSpacing: '-0.045em' }}
    >
      <span className="text-foreground">hia</span>
      <span className="relative inline-flex items-baseline">
        <span className="text-primary">i</span>
        {/* turmeric dot above the i */}
        <span
          className="pointer-events-none absolute"
          style={{
            width: 6, height: 6,
            background: 'var(--accent)',
            borderRadius: '50%',
            top: -3, left: 4,
          }}
        />
      </span>
      <span className="text-foreground">sha</span>
    </span>
  );
}

export function Navbar() {
  const router = useRouter();
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (search.trim()) router.push(`/search?q=${encodeURIComponent(search.trim())}`);
  }

  function handleLogout() {
    removeToken(); // dispatches hiaisha-auth-change → useAuth sets user to null
    router.push('/');
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-line bg-surface shadow-warm-sm">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-4">
        {/* Logo */}
        <Link href="/" className="shrink-0">
          <HiaishaLogo />
        </Link>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex-1 max-w-md hidden sm:flex">
          <div className="relative w-full">
            <svg
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-muted"
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
            </svg>
            <input
              type="search"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Cari apa-apa…"
              className="w-full pl-9 pr-4 py-1.5 rounded-pill border border-line text-sm focus:outline-none focus:border-primary bg-surface-bg transition"
            />
          </div>
        </form>

        {/* Right side */}
        <div className="ml-auto flex items-center gap-2">
          {user ? (
            <>
              <Link href="/notifications" className="relative p-2 text-ink-muted hover:text-primary transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </Link>
              <Link
                href={`/u/${user.username}`}
                className="text-sm font-medium text-ink hover:text-primary transition-colors"
              >
                {user.username}
              </Link>
              {user.is_admin === 1 && (
                <Link href="/admin" className="text-sm font-semibold text-primary hover:text-primary-600">
                  Admin
                </Link>
              )}
              <Link href="/settings" className="text-sm text-ink-muted hover:text-primary transition-colors">
                Settings
              </Link>
              <button
                onClick={handleLogout}
                className="text-sm text-ink-muted hover:text-primary transition-colors"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm px-3.5 py-1.5 border border-line-strong rounded-pill text-ink hover:border-primary hover:text-primary transition-colors"
              >
                Log masuk
              </Link>
              <Link
                href="/register"
                className="text-sm px-3.5 py-1.5 bg-primary text-white rounded-pill font-display font-bold hover:bg-primary-600 transition-colors"
              >
                Daftar
              </Link>
            </>
          )}
          <button className="sm:hidden p-2 text-ink-muted" onClick={() => setMobileOpen(v => !v)}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d={mobileOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="sm:hidden px-4 pb-3 border-t border-line bg-surface">
          <form onSubmit={handleSearch} className="mt-3 mb-2">
            <input
              type="search"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Cari apa-apa…"
              className="w-full px-4 py-2 rounded-pill border border-line text-sm focus:outline-none focus:border-primary bg-surface-bg transition"
            />
          </form>
          <Link href="/communities" className="block py-2 text-sm hover:text-primary transition-colors">
            Semua Topik
          </Link>
          <Link href="/submit" className="block py-2 text-sm hover:text-primary transition-colors">
            Post
          </Link>
        </div>
      )}
    </nav>
  );
}
