'use client';
import Link from 'next/link';
import { useState } from 'react';
import { joinCommunity, leaveCommunity } from '@/lib/api';
import { isLoggedIn } from '@/lib/auth';
import type { Community } from '@hiaisha/types';

interface Props {
  community: Community;
}

export function CommunityCard({ community }: Props) {
  const [isMember, setIsMember] = useState(community.is_member ?? false);
  const [loading, setLoading] = useState(false);
  const loggedIn = isLoggedIn();

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

  return (
    <Link href={`/c/${community.slug}`} className="block">
      <div className="bg-white rounded-card border border-gray-200 hover:border-primary/40 transition-colors p-4 group">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-[#1A1A1A] group-hover:text-primary truncate">
              c/{community.slug}
            </h3>
            <p className="text-sm font-medium text-[#1A1A1A] mt-0.5">{community.name}</p>
            {community.description && (
              <p className="text-xs text-muted mt-1 line-clamp-2">{community.description}</p>
            )}
          </div>
          {loggedIn && (
            <button
              onClick={handleJoin}
              disabled={loading}
              className={`shrink-0 text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
                isMember
                  ? 'border border-gray-300 text-muted hover:border-red-300 hover:text-red-500'
                  : 'bg-primary text-white hover:bg-primary-dark'
              } disabled:opacity-50`}
            >
              {isMember ? 'Joined' : 'Join'}
            </button>
          )}
        </div>

        <div className="flex items-center gap-4 mt-3 text-xs text-muted">
          <span>
            <span className="font-semibold text-[#1A1A1A]">{community.member_count.toLocaleString()}</span> members
          </span>
          <span>
            <span className="font-semibold text-[#1A1A1A]">{community.post_count.toLocaleString()}</span> posts
          </span>
        </div>
      </div>
    </Link>
  );
}
