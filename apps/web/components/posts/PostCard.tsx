'use client';
import Link from 'next/link';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import { VoteButtons } from '../ui/VoteButtons';
import { TagBadge } from '../ui/TagBadge';
import { LocationBadge } from '../ui/LocationBadge';
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

  async function handleVote(value: 1 | -1) {
    if (!loggedIn) return;
    const prev = userVote;
    const prevScore = score;
    // Optimistic update: toggling same vote removes it
    const newVote = prev === value ? null : value;
    const delta = (newVote ?? 0) - (prev ?? 0);
    setScore(s => s + delta);
    setUserVote(newVote);
    try {
      await votePost(post.id, value);
      onVote?.(post.id, value);
    } catch {
      setScore(prevScore);
      setUserVote(prev);
    }
  }

  const timeAgo = formatDistanceToNow(new Date(post.created_at * 1000), { addSuffix: true });
  const thumbnail = post.images?.[0];

  return (
    <div className="flex gap-3 bg-white rounded-card border border-gray-200 hover:border-gray-300 transition-colors p-3 group">
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
        <div className="flex items-center gap-1.5 text-xs text-muted mb-1 flex-wrap">
          {post.community && (
            <Link href={`/c/${post.community.slug}`} className="font-semibold text-[#1A1A1A] hover:text-primary">
              c/{post.community.slug}
            </Link>
          )}
          <span>·</span>
          <span>Posted by</span>
          {post.author && (
            <Link href={`/u/${post.author.username}`} className="hover:text-primary">
              u/{post.author.username}
            </Link>
          )}
          <span>·</span>
          <span>{timeAgo}</span>
          {post.is_pinned === 1 && (
            <span className="bg-green-100 text-green-700 px-1.5 py-0.5 rounded text-xs font-medium">Pinned</span>
          )}
        </div>

        <Link href={`/post/${post.id}`}>
          <h2 className="font-semibold text-[#1A1A1A] group-hover:text-primary leading-snug mb-1">
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
        <div className="flex items-center gap-3 text-xs text-muted">
          <Link href={`/post/${post.id}`} className="flex items-center gap-1 hover:text-primary">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            {post.comment_count} comment{post.comment_count !== 1 ? 's' : ''}
          </Link>
          <Link href={`/post/${post.id}`} className="hover:text-primary">
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
            className="w-20 h-16 object-cover rounded-md"
          />
        </Link>
      )}
    </div>
  );
}
