'use client';
import { useState } from 'react';
import { reportPost } from '@/lib/api';

interface Props {
  targetId: string;
  targetType: 'post' | 'comment';
  onClose: () => void;
  onReport?: (reason: string) => Promise<void>;
}

const reasons = [
  { value: 'spam', label: 'Spam' },
  { value: 'misinformation', label: 'Misinformation' },
  { value: 'off-topic', label: 'Off-topic' },
  { value: 'offensive', label: 'Offensive / Hateful' },
];

export function ReportModal({ targetId, targetType, onClose, onReport }: Props) {
  const [selected, setSelected] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit() {
    if (!selected) return;
    setLoading(true);
    setError('');
    try {
      if (onReport) {
        await onReport(selected);
      } else {
        await reportPost(targetId, selected);
      }
      setDone(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to submit report');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-card w-full max-w-sm shadow-xl">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">Report {targetType === 'post' ? 'Post' : 'Comment'}</h3>
          <button onClick={onClose} className="text-muted hover:text-[#1A1A1A]">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {done ? (
          <div className="p-6 text-center">
            <p className="text-green-600 font-medium">Report submitted. Thank you!</p>
            <button onClick={onClose} className="mt-4 text-sm text-muted hover:text-primary">Close</button>
          </div>
        ) : (
          <div className="p-4">
            <p className="text-sm text-muted mb-3">Why are you reporting this?</p>
            <div className="space-y-2">
              {reasons.map(r => (
                <label key={r.value} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="reason"
                    value={r.value}
                    checked={selected === r.value}
                    onChange={() => setSelected(r.value)}
                    className="text-primary"
                  />
                  <span className="text-sm">{r.label}</span>
                </label>
              ))}
            </div>
            {error && <p className="text-sm text-red-500 mt-3">{error}</p>}
            <div className="flex gap-2 mt-4">
              <button
                onClick={onClose}
                className="flex-1 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!selected || loading}
                className="flex-1 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50"
              >
                {loading ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
