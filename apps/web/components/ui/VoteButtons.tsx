'use client';
import { useState } from 'react';
import clsx from 'clsx';

interface Props {
  score: number;
  userVote: 1 | -1 | null | undefined;
  onVote: (value: 1 | -1) => Promise<void>;
  disabled?: boolean;
}

export function VoteButtons({ score, userVote, onVote, disabled }: Props) {
  const [pending, setPending] = useState(false);

  async function handleVote(value: 1 | -1) {
    if (disabled || pending) return;
    setPending(true);
    try { await onVote(value); } finally { setPending(false); }
  }

  return (
    <div className="flex flex-col items-center gap-0.5 select-none">
      <button
        onClick={() => handleVote(1)}
        disabled={disabled || pending}
        className={clsx('p-1 rounded hover:bg-orange-50 transition-colors', {
          'text-primary': userVote === 1,
          'text-muted hover:text-primary': userVote !== 1,
        })}
        title={disabled ? 'Login to vote' : 'Upvote'}
      >
        <svg className="w-4 h-4" fill={userVote === 1 ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
        </svg>
      </button>
      <span className={clsx('text-xs font-bold tabular-nums', {
        'text-primary': userVote === 1,
        'text-blue-500': userVote === -1,
        'text-muted': !userVote,
      })}>
        {score}
      </span>
      <button
        onClick={() => handleVote(-1)}
        disabled={disabled || pending}
        className={clsx('p-1 rounded hover:bg-blue-50 transition-colors', {
          'text-blue-500': userVote === -1,
          'text-muted hover:text-blue-500': userVote !== -1,
        })}
        title={disabled ? 'Login to vote' : 'Downvote'}
      >
        <svg className="w-4 h-4" fill={userVote === -1 ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
    </div>
  );
}
