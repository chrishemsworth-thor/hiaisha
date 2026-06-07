'use client';
import Link from 'next/link';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import { VoteButtons } from '../ui/VoteButtons';
import { TagBadge } from '../ui/TagBadge';
import { LocationBadge } from '../ui/LocationBadge';
import { getCommunityMeta } from '@/lib/communities';
import { votePost } from '@/lib/api';
import { useAuth } from '@/lib/use-auth';
import { useState } from 'react';
import type { Post } from '@hiaisha/types';

interface Props {
  post: Post;
  onVote?: (postId: string, newValue: 1 | -1) => void;
}

export function PostCard({ post, onVote }: Props) {
  const [score, setScore] = useState(post.score);
  const [userVote, setUserVote] = useState<1 | -1 | null>(post.user_vote ?? null);
  const { isLoggedIn: loggedIn } = useAuth();

  const meta = post.community ? getCommunityMeta(post.community.slug) : undefined;
  const communityFg = meta?.fg ?? '#4F3DE0';

  async function handleVote(value: 1 | -1) {
    if (!loggedIn) return;
    const prev = userVote;
    const prevScore = score;
    const newVote = prev === value ? null : value;
    const delta = (newVote ?? 0) - (prev ?? 0);
    setScore(s => s + delta);
    setUserVote(newVote);
    try {
      const res = await votePost(post.id, newVote ?? 0);
      if (res.data && 'score' in res.data) {
        setScore(res.data.score);
        setUserVote(res.data.user_vote);
      }
      onVote?.(post.id, value);
    } catch {
      setScore(prevScore);
      setUserVote(prev);
    }
  }

  const timeAgo = formatDistanceToNow(new Date(post.created_at * 1000), { addSuffix: true });
  const thumbnail = post.images?.[0];

  return (
    <div className="flex gap-3 bg-surface rounded-card border border-line shadow-warm-sm hover:shadow-warm hover:-translate-y-px transition-all p-3 group">
      {/* Vote buttons */}
      <div className="flex flex-col items-center pt-0.5">
        <VoteButtons
          score={score}
          userVote={userVote}
          onVote={handleVote}
          disabled={!loggedIn}
        />
      </div>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        {/* Meta row */}
        <div className="flex items-center gap-1.5 text-xs text-ink-muted mb-1 flex-wrap">
          {post.community && (
            <Link
              href={`/c/${post.community.slug}`}
              className="font-display font-bold hover:underline"
              style={{ color: communityFg }}
            >
              c/{post.community.slug}
            </Link>
          )}
          <span className="opacity-40">·</span>
          <span>by</span>
          {post.author && (
            <Link href={`/u/${post.author.username}`} className="font-medium hover:text-primary transition-colors">
              u/{post.author.username}
            </Link>
          )}
          <span className="opacity-40">·</span>
          <span className="font-mono">{timeAgo}</span>
          {post.is_pinned === 1 && (
            <span className="bg-[#DCF1E7] text-[#059669] px-1.5 py-0.5 rounded-pill text-xs font-display font-bold">
              📌 Pinned
            </span>
          )}
        </div>

        {/* Title */}
        <Link href={`/post/${post.id}`}>
          <h2 className="font-display font-bold text-ink group-hover:text-primary leading-snug mb-1.5 tracking-tight transition-colors">
            {post.title}
          </h2>
        </Link>

        {post.location_tag && (
          <div className="mb-1.5">
            <LocationBadge location={post.location_tag} />
          </div>
        )}

        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {post.tags.map(tag => <TagBadge key={tag} tag={tag} />)}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center gap-3 text-xs text-ink-muted">
          <Link
            href={`/post/${post.id}`}
            className="inline-flex items-center gap-1 hover:text-primary transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            {post.comment_count} komen
          </Link>
          <Link href={`/post/${post.id}`} className="hover:text-primary transition-colors">
            Discuss
          </Link>
        </div>
      </div>

      {/* Thumbnail */}
      {thumbnail && (
        <Link href={`/post/${post.id}`} className="shrink-0">
          <Image
            src={thumbnail.url}
            alt={post.title}
            width={80}
            height={60}
            className="w-20 h-16 object-cover rounded-[10px]"
          />
        </Link>
      )}
    </div>
  );
}
