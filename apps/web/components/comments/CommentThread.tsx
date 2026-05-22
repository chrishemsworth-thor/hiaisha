'use client';
import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { VoteButtons } from '@/components/ui/VoteButtons';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { CommentBox } from './CommentBox';
import { voteComment, createComment } from '@/lib/api';
import { isLoggedIn } from '@/lib/auth';
import type { Comment } from '@hiaisha/types';

interface Props {
  comment: Comment;
  postId: string;
  depth?: number;
}

export function CommentThread({ comment: initialComment, postId, depth = 0 }: Props) {
  const [comment, setComment] = useState(initialComment);
  const [showReply, setShowReply] = useState(false);
  const [replies, setReplies] = useState(initialComment.replies ?? []);

  async function handleVote(value: 1 | -1) {
    await voteComment(comment.id, value);
    setComment(c => ({
      ...c,
      score: c.score + (value === c.user_vote ? -value : value - (c.user_vote ?? 0)),
      user_vote: c.user_vote === value ? null : value,
    }));
  }

  async function handleReply(body: string) {
    const res = await createComment(postId, { body, parent_id: comment.id });
    if (res.data) {
      setReplies(r => [...r, res.data!]);
      setShowReply(false);
    }
  }

  if (comment.is_deleted) {
    return (
      <div className={`${depth > 0 ? 'ml-4 pl-3 border-l-2 border-gray-100' : ''} py-2`}>
        <p className="text-sm text-muted italic">[deleted]</p>
        {replies.map(r => <CommentThread key={r.id} comment={r} postId={postId} depth={depth + 1} />)}
      </div>
    );
  }

  return (
    <div className={`${depth > 0 ? 'ml-4 pl-3 border-l-2 border-gray-100' : ''} py-2`}>
      <div className="flex gap-2">
        <VoteButtons score={comment.score} userVote={comment.user_vote} onVote={handleVote} disabled={!isLoggedIn()} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-xs text-muted mb-1">
            {comment.author && (
              <>
                <UserAvatar username={comment.author.username} avatarUrl={comment.author.avatar_url} size="sm" />
                <Link href={`/u/${comment.author.username}`} className="font-medium text-[#1A1A1A] hover:text-primary">
                  {comment.author.username}
                </Link>
              </>
            )}
            <span>{formatDistanceToNow(new Date(comment.created_at * 1000), { addSuffix: true })}</span>
          </div>
          <p className="text-sm text-[#1A1A1A] whitespace-pre-line">{comment.body}</p>
          {isLoggedIn() && depth < 3 && (
            <button onClick={() => setShowReply(v => !v)} className="text-xs text-muted hover:text-primary mt-1">
              Reply
            </button>
          )}
          {showReply && (
            <div className="mt-2">
              <CommentBox onSubmit={handleReply} onCancel={() => setShowReply(false)} autoFocus placeholder="Reply lah..." />
            </div>
          )}
        </div>
      </div>
      {replies.map(r => <CommentThread key={r.id} comment={r} postId={postId} depth={depth + 1} />)}
    </div>
  );
}
