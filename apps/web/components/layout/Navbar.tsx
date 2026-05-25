'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { removeToken } from '@/lib/auth';
import { useAuth } from '@/lib/use-auth';

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
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-4">
        {/* Logo */}
        <Link href="/" className="font-display text-xl font-bold shrink-0">
          <span className="text-primary">H</span>
          <span className="text-[#1A1A1A]">iaisha</span>
        </Link>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex-1 max-w-md hidden sm:flex">
          <input
            type="search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cari apa-apa..."
            className="w-full px-4 py-1.5 rounded-full border border-gray-300 text-sm focus:outline-none focus:border-primary bg-surface-bg"
          />
        </form>

        {/* Right side */}
        <div className="ml-auto flex items-center gap-2">
          {user ? (
            <>
              <Link href="/notifications" className="relative p-2 text-muted hover:text-primary">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </Link>
              <Link href={`/u/${user.username}`} className="text-sm font-medium text-[#1A1A1A] hover:text-primary">
                {user.username}
              </Link>
              {user.is_admin === 1 && (
                <Link href="/admin" className="text-sm font-semibold text-primary hover:text-primary-dark">
                  Admin
                </Link>
              )}
              <Link href="/settings" className="text-sm text-muted hover:text-primary">
                Settings
              </Link>
              <button onClick={handleLogout} className="text-sm text-muted hover:text-primary">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm px-3 py-1.5 border border-gray-300 rounded-full hover:border-primary hover:text-primary">
                Login
              </Link>
              <Link href="/register" className="text-sm px-3 py-1.5 bg-primary text-white rounded-full hover:bg-primary-dark">
                Daftar
              </Link>
            </>
          )}
          <button className="sm:hidden p-2" onClick={() => setMobileOpen(v => !v)}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={mobileOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="sm:hidden px-4 pb-3 border-t border-gray-200 bg-white">
          <form onSubmit={handleSearch} className="mt-3 mb-2">
            <input
              type="search"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Cari apa-apa..."
              className="w-full px-4 py-2 rounded-full border border-gray-300 text-sm focus:outline-none focus:border-primary bg-surface-bg"
            />
          </form>
          <Link href="/communities" className="block py-2 text-sm hover:text-primary">Communities</Link>
          <Link href="/submit" className="block py-2 text-sm hover:text-primary">Post</Link>
        </div>
      )}
    </nav>
  );
}
