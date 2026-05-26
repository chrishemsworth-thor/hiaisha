'use client';
import Link from 'next/link';
import { useState } from 'react';
import { joinCommunity, leaveCommunity } from '@/lib/api';
import { useAuth } from '@/lib/use-auth';
import { getCommunityMeta, formatMemberCount } from '@/lib/communities';
import type { Community } from '@hiaisha/types';

interface Props {
  community: Community;
  postsToday?: number;
}

export function CommunityCard({ community, postsToday }: Props) {
  const [isMember, setIsMember] = useState(community.is_member ?? false);
  const [loading, setLoading] = useState(false);
  const { isLoggedIn: loggedIn } = useAuth();

  // Augment with local visual metadata if slug is known
  const meta = getCommunityMeta(community.slug);
  const fg  = meta?.fg  ?? '#4F3DE0';
  const bg  = meta?.bg  ?? '#ECE9FC';
  const cat = meta?.cat ?? 'General';
  const emoji = meta?.emoji ?? '💬';

  async function handleJoin(e: React.MouseEvent) {
    e.preventDefault();
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

  const membersLabel = formatMemberCount(community.member_count);

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-card border border-line bg-surface shadow-warm-sm transition hover:-translate-y-0.5 hover:shadow-warm">
      {/* color strip */}
      <div className="h-1.5 shrink-0" style={{ background: fg }} />

      <div className="flex flex-col gap-3 p-4">
        <div className="flex items-start gap-3">
          {/* emoji tile */}
          <div
            className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-xl text-[22px]"
            style={{ background: bg }}
            aria-hidden
          >
            {emoji}
          </div>

          <div className="min-w-0 flex-1">
            {/* category pill + slug */}
            <div className="mb-1 flex items-center gap-1.5">
              <span
                className="rounded-pill px-2 py-0.5 font-display text-[10.5px] font-bold uppercase tracking-wider"
                style={{ background: bg, color: fg }}
              >
                {cat}
              </span>
              <span className="font-mono text-[11.5px] text-ink-soft">c/{community.slug}</span>
            </div>
            {/* name */}
            <Link
              href={`/c/${community.slug}`}
              className="font-display text-base font-bold leading-tight tracking-tight text-ink hover:underline"
            >
              {community.name}
            </Link>
          </div>
        </div>

        {/* description */}
        {community.description && (
          <p className="text-[13.5px] leading-snug text-ink-muted line-clamp-2">
            {community.description}
          </p>
        )}

        {/* footer meta */}
        <div className="mt-1 flex items-center gap-3 border-t border-line pt-2.5 text-xs text-ink-muted">
          {/* members */}
          <span className="inline-flex items-center gap-1">
            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <b className="font-display text-ink">{membersLabel}</b>
          </span>

          {postsToday ? (
            <span className="inline-flex items-center gap-1">
              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M5 3l14 9-14 9V3z" />
              </svg>
              <b className="font-display text-ink">{postsToday}</b>
              <span>today</span>
            </span>
          ) : null}

          {loggedIn && (
            <button
              onClick={handleJoin}
              disabled={loading}
              className="ml-auto rounded-pill px-3.5 py-1.5 font-display text-xs font-bold transition disabled:opacity-50"
              style={
                isMember
                  ? { background: 'transparent', color: fg, border: `1px solid ${fg}` }
                  : { background: fg, color: 'white', border: '1px solid transparent' }
              }
            >
              {loading ? '…' : isMember ? '✓ Joined' : 'Sertai'}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
