'use client';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { MarkdownRenderer } from '@/components/ui/MarkdownRenderer';
import { ImageGallery } from '@/components/ui/ImageGallery';
import { TagBadge } from '@/components/ui/TagBadge';
import { LocationBadge } from '@/components/ui/LocationBadge';
import { VoteButtons } from '@/components/ui/VoteButtons';
import { CommentThread } from '@/components/comments/CommentThread';
import { CommentBox } from '@/components/comments/CommentBox';
import { getPost, getComments, createComment, votePost } from '@/lib/api';
import { isLoggedIn } from '@/lib/auth';
import type { Post, Comment } from '@hiaisha/types';

export default function PostPage({ params }: { params: { id: string } }) {
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFoundState, setNotFoundState] = useState(false);

  useEffect(() => {
    Promise.all([getPost(params.id), getComments(params.id)])
      .then(([postRes, commentsRes]) => {
        if (!postRes.data) { setNotFoundState(true); return; }
        setPost(postRes.data);
        setComments(commentsRes.data ?? []);
      })
      .catch(() => setNotFoundState(true))
      .finally(() => setLoading(false));
  }, [params.id]);

  async function handleVote(value: 1 | -1) {
    if (!post) return;
    await votePost(post.id, value);
    setPost(p => p ? ({
      ...p,
      score: p.score + (value === p.user_vote ? -value : value - (p.user_vote ?? 0)),
      user_vote: p.user_vote === value ? null : value,
    }) : null);
  }

  async function handleComment(body: string) {
    const res = await createComment(params.id, { body });
    if (res.data) setComments(c => [...c, res.data!]);
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <div className="bg-white rounded-card border border-gray-200 p-6 animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-3/4 mb-4" />
          <div className="h-4 bg-gray-100 rounded w-1/2" />
        </div>
      </div>
    );
  }

  if (notFoundState || !post) {
    return (
      <div className="max-w-3xl mx-auto text-center py-16">
        <p className="text-muted">Post not found lah!</p>
        <Link href="/" className="text-primary hover:underline mt-2 block">Go back home</Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-card border border-gray-200 p-6 mb-4">
        <div className="flex gap-3">
          <VoteButtons score={post.score} userVote={post.user_vote} onVote={handleVote} disabled={!isLoggedIn()} />
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted mb-2">
              {post.community && (
                <Link href={`/c/${post.community.slug}`} className="font-semibold text-[#1A1A1A] hover:text-primary">
                  c/{post.community.slug}
                </Link>
              )}
              <span>·</span>
              {post.author && <Link href={`/u/${post.author.username}`} className="hover:text-primary">u/{post.author.username}</Link>}
              <span>·</span>
              <span>{formatDistanceToNow(new Date(post.created_at * 1000), { addSuffix: true })}</span>
            </div>
            <h1 className="font-display font-bold text-xl mb-4">{post.title}</h1>
            {post.post_type === 'image' && post.images?.length ? (
              <ImageGallery images={post.images} />
            ) : null}
            {post.body && (
              <div className="mt-4">
                <MarkdownRenderer content={post.body} />
              </div>
            )}
            <div className="flex flex-wrap gap-2 mt-4">
              {post.location_tag && <LocationBadge location={post.location_tag} />}
              {post.tags?.map(t => <TagBadge key={t} tag={t} />)}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100 text-sm text-muted">
              {post.score} points · {post.comment_count} comments
            </div>
          </div>
        </div>
      </div>

      {isLoggedIn() && (
        <div className="bg-white rounded-card border border-gray-200 p-4 mb-4">
          <h2 className="font-semibold text-sm mb-3">Leave a comment</h2>
          <CommentBox onSubmit={handleComment} />
        </div>
      )}

      <div className="space-y-1">
        {comments.map(comment => (
          <CommentThread key={comment.id} comment={comment} postId={params.id} />
        ))}
      </div>
    </div>
  );
}
