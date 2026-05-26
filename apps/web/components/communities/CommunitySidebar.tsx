'use client';
import Link from 'next/link';
import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { joinCommunity, leaveCommunity } from '@/lib/api';
import { useAuth } from '@/lib/use-auth';
import { getCommunityMeta } from '@/lib/communities';
import type { Community } from '@hiaisha/types';

interface Props {
  community: Community;
}

export function CommunitySidebar({ community }: Props) {
  const [isMember, setIsMember] = useState(community.is_member ?? false);
  const [loading, setLoading] = useState(false);
  const { isLoggedIn: loggedIn, user: currentUser } = useAuth();
  const isAdmin = currentUser?.is_admin === 1;

  const meta = getCommunityMeta(community.slug);
  const fg    = meta?.fg    ?? '#4F3DE0';
  const bg    = meta?.bg    ?? '#ECE9FC';
  const emoji = meta?.emoji ?? '💬';
  const cat   = meta?.cat   ?? 'General';

  async function handleJoin() {
    if (!loggedIn || loading) return;
    setLoading(true);
    try {
      if (isMember) {
        await leaveCommunity(community.slug);
        setIsMember(false);
      } else {
        await joinCommunity(community.slug);
        setIsMember(true);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  const createdAgo = formatDistanceToNow(new Date(community.created_at * 1000), { addSuffix: true });

  return (
    <div className="bg-surface rounded-card border border-line shadow-warm-sm overflow-hidden">
      {/* color strip header */}
      <div className="h-1.5" style={{ background: fg }} />

      <div className="p-4">
        {/* Emoji + name */}
        <div className="flex items-center gap-3 mb-3">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-xl text-[22px] shrink-0"
            style={{ background: bg }}
            aria-hidden
          >
            {emoji}
          </div>
          <div>
            <div className="mb-0.5">
              <span
                className="rounded-pill px-2 py-0.5 font-display text-[10px] font-bold uppercase tracking-wider"
                style={{ background: bg, color: fg }}
              >
                {cat}
              </span>
            </div>
            <h2 className="font-display font-bold text-base leading-tight tracking-tight text-ink">
              {community.name}
            </h2>
          </div>
        </div>

        {community.description && (
          <p className="text-sm text-ink-muted mb-3 leading-relaxed">{community.description}</p>
        )}

        <div className="flex gap-4 mb-3 text-sm border-t border-line pt-3">
          <div>
            <div className="font-display font-bold text-ink">{community.member_count.toLocaleString()}</div>
            <div className="text-xs text-ink-muted">Members</div>
          </div>
          <div>
            <div className="font-display font-bold text-ink">{community.post_count.toLocaleString()}</div>
            <div className="text-xs text-ink-muted">Posts</div>
          </div>
        </div>

        <p className="text-xs text-ink-soft mb-3 font-mono">Created {createdAgo}</p>

        <div className="space-y-2">
          {loggedIn ? (
            <>
              <button
                onClick={handleJoin}
                disabled={loading}
                className="w-full py-2 text-sm rounded-pill font-display font-bold transition-colors disabled:opacity-50"
                style={
                  isMember
                    ? { background: 'transparent', color: fg, border: `1px solid ${fg}` }
                    : { background: fg, color: 'white', border: '1px solid transparent' }
                }
              >
                {loading ? '…' : isMember ? '✓ Joined' : 'Sertai'}
              </button>
              <Link
                href={`/c/${community.slug}/submit`}
                className="block w-full py-2 text-sm text-center border border-line-strong text-ink rounded-pill hover:border-primary hover:text-primary font-display font-semibold transition-colors"
              >
                Post here
              </Link>
              {isAdmin && (
                <Link
                  href={`/mod/${community.slug}`}
                  className="block w-full py-2 text-sm text-center border border-line text-ink-muted rounded-pill hover:border-primary hover:text-primary font-display font-semibold transition-colors"
                >
                  🛡 Mod Queue
                </Link>
              )}
            </>
          ) : (
            <Link
              href="/login"
              className="block w-full py-2 text-sm text-center text-white rounded-pill font-display font-bold transition-colors"
              style={{ background: fg }}
            >
              Log masuk untuk sertai
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
