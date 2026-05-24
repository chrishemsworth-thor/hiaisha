'use client';
import Link from 'next/link';
import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { joinCommunity, leaveCommunity } from '@/lib/api';
import { isLoggedIn, getCurrentUser } from '@/lib/auth';
import type { Community } from '@hiaisha/types';

interface Props {
  community: Community;
}

export function CommunitySidebar({ community }: Props) {
  const [isMember, setIsMember] = useState(community.is_member ?? false);
  const [loading, setLoading] = useState(false);
  const loggedIn = isLoggedIn();
  const currentUser = getCurrentUser();
  const isAdmin = currentUser?.is_admin === 1;

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
    <div className="bg-white rounded-card border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary-light h-16" />
      <div className="p-4">
        <h2 className="font-display font-bold text-lg">{community.name}</h2>
        {community.description && (
          <p className="text-sm text-muted mt-1">{community.description}</p>
        )}

        <div className="flex gap-4 mt-3 text-sm">
          <div>
            <div className="font-semibold text-[#1A1A1A]">{community.member_count.toLocaleString()}</div>
            <div className="text-xs text-muted">Members</div>
          </div>
          <div>
            <div className="font-semibold text-[#1A1A1A]">{community.post_count.toLocaleString()}</div>
            <div className="text-xs text-muted">Posts</div>
          </div>
        </div>

        <p className="text-xs text-muted mt-2">Created {createdAgo}</p>

        <div className="mt-3 space-y-2">
          {loggedIn ? (
            <>
              <button
                onClick={handleJoin}
                disabled={loading}
                className={`w-full py-2 text-sm rounded-full font-medium transition-colors ${
                  isMember
                    ? 'border border-gray-300 hover:border-red-300 hover:text-red-500'
                    : 'bg-primary text-white hover:bg-primary-dark'
                } disabled:opacity-50`}
              >
                {loading ? '...' : isMember ? 'Leave Community' : 'Join Community'}
              </button>
              <Link
                href={`/c/${community.slug}/submit`}
                className="block w-full py-2 text-sm text-center border border-primary text-primary rounded-full hover:bg-primary/5 font-medium"
              >
                Post in this community
              </Link>
              {isAdmin && (
                <Link
                  href={`/mod/${community.slug}`}
                  className="block w-full py-2 text-sm text-center border border-gray-300 text-gray-600 rounded-full hover:border-primary hover:text-primary font-medium"
                >
                  🛡 Mod Queue
                </Link>
              )}
            </>
          ) : (
            <Link
              href="/login"
              className="block w-full py-2 text-sm text-center bg-primary text-white rounded-full hover:bg-primary-dark font-medium"
            >
              Login to join
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
