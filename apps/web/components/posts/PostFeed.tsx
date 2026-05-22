import { PostCard } from './PostCard';
import type { Post } from '@hiaisha/types';

interface Props {
  posts: Post[];
  loading?: boolean;
}

function PostSkeleton() {
  return (
    <div className="flex gap-3 bg-white rounded-card border border-gray-200 p-3 animate-pulse">
      <div className="flex flex-col items-center gap-1 pt-0.5">
        <div className="w-6 h-6 bg-gray-200 rounded" />
        <div className="w-8 h-4 bg-gray-200 rounded" />
        <div className="w-6 h-6 bg-gray-200 rounded" />
      </div>
      <div className="flex-1 space-y-2">
        <div className="h-3 bg-gray-200 rounded w-48" />
        <div className="h-5 bg-gray-200 rounded w-3/4" />
        <div className="h-3 bg-gray-200 rounded w-32" />
      </div>
    </div>
  );
}

export function PostFeed({ posts, loading = false }: Props) {
  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => <PostSkeleton key={i} />)}
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-16 text-muted">
        <div className="text-4xl mb-3">🍜</div>
        <p className="text-lg font-medium">No posts yet — be the first to post lah!</p>
        <p className="text-sm mt-1">Share your makan finds with the community.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {posts.map(post => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
}
