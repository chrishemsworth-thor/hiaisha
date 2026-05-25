'use client';
import { useState, useEffect } from 'react';
import { getCurrentUser } from './auth';
import type { User } from '@hiaisha/types';

/** Fired by setToken / removeToken so every mounted component re-syncs. */
export const AUTH_CHANGE_EVENT = 'hiaisha-auth-change';

export function useAuth() {
  // Start null — matches server render, prevents hydration mismatch.
  const [user, setUser] = useState<Partial<User> | null>(null);

  useEffect(() => {
    // Read the real value once the client has hydrated.
    setUser(getCurrentUser());

    // Stay in sync whenever the token is written or cleared.
    const sync = () => setUser(getCurrentUser());
    window.addEventListener(AUTH_CHANGE_EVENT, sync);
    return () => window.removeEventListener(AUTH_CHANGE_EVENT, sync);
  }, []);

  return { user, isLoggedIn: user !== null };
}
