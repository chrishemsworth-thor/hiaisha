'use client';
import { useState } from 'react';

interface Props {
  onSubmit: (body: string) => Promise<void>;
  placeholder?: string;
  autoFocus?: boolean;
  onCancel?: () => void;
}

export function CommentBox({ onSubmit, placeholder = 'Share your thoughts lah...', autoFocus, onCancel }: Props) {
  const [body, setBody] = useState('');
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setPending(true);
    try {
      await onSubmit(body.trim());
      setBody('');
    } finally { setPending(false); }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <textarea
        value={body}
        onChange={e => setBody(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        rows={3}
        maxLength={10000}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:border-primary bg-surface-bg"
      />
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted">{body.length}/10000</span>
        <div className="flex gap-2">
          {onCancel && (
            <button type="button" onClick={onCancel} className="px-3 py-1.5 text-sm text-muted hover:text-primary">
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={!body.trim() || pending}
            className="px-4 py-1.5 bg-primary text-white rounded-full text-sm hover:bg-primary-dark disabled:opacity-50"
          >
            {pending ? 'Posting...' : 'Comment'}
          </button>
        </div>
      </div>
    </form>
  );
}
