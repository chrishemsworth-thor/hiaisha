'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  getModQueue, modRemovePost, modPinPost, modBanUserFromCommunity,
  PostReport, CommentReport,
} from '@/lib/api';
import { getCurrentUser } from '@/lib/auth';

type ActionState = { loading: boolean; done: boolean; error: string | null };

function timeAgo(ts: number): string {
  const secs = Math.floor(Date.now() / 1000) - ts;
  if (secs < 60) return `${secs}s ago`;
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  return `${Math.floor(secs / 86400)}d ago`;
}

const REASON_LABELS: Record<string, string> = {
  spam: 'Spam',
  misinformation: 'Misinformation',
  'off-topic': 'Off-Topic',
  offensive: 'Offensive',
};

function ReasonBadge({ reason }: { reason: string }) {
  const colours: Record<string, string> = {
    spam: 'bg-yellow-100 text-yellow-800',
    misinformation: 'bg-orange-100 text-orange-800',
    'off-topic': 'bg-blue-100 text-blue-800',
    offensive: 'bg-red-100 text-red-800',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colours[reason] ?? 'bg-gray-100 text-gray-700'}`}>
      {REASON_LABELS[reason] ?? reason}
    </span>
  );
}

function ActionButton({
  label, onClick, variant = 'default', disabled,
}: {
  label: string;
  onClick: () => void;
  variant?: 'default' | 'danger' | 'accent';
  disabled?: boolean;
}) {
  const base = 'inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold transition disabled:opacity-40 disabled:cursor-not-allowed';
  const variants = {
    default: 'bg-surface-bg border border-gray-200 text-gray-700 hover:bg-gray-100',
    danger: 'bg-primary text-white hover:bg-primary-dark',
    accent: 'bg-accent text-white hover:bg-accent-dark',
  };
  return (
    <button className={`${base} ${variants[variant]}`} onClick={onClick} disabled={disabled}>
      {label}
    </button>
  );
}

// ── Post report row ──────────────────────────────────────────────────────────
function PostReportRow({
  report,
  slug,
  onDismiss,
}: {
  report: PostReport;
  slug: string;
  onDismiss: (id: string) => void;
}) {
  const [removing, setRemoving] = useState<ActionState>({ loading: false, done: false, error: null });
  const [pinning, setPinning] = useState<ActionState>({ loading: false, done: false, error: null });
  const [banning, setBanning] = useState<ActionState>({ loading: false, done: false, error: null });
  const [isPinned, setIsPinned] = useState(false);

  async function handleRemove() {
    setRemoving({ loading: true, done: false, error: null });
    try {
      await modRemovePost(report.target_id);
      setRemoving({ loading: false, done: true, error: null });
      setTimeout(() => onDismiss(report.id), 600);
    } catch (e: any) {
      setRemoving({ loading: false, done: false, error: e.message });
    }
  }

  async function handlePin() {
    setPinning({ loading: true, done: false, error: null });
    try {
      const res = await modPinPost(report.target_id);
      setIsPinned(res.data?.is_pinned === 1);
      setPinning({ loading: false, done: true, error: null });
    } catch (e: any) {
      setPinning({ loading: false, done: false, error: e.message });
    }
  }

  async function handleBan() {
    if (!confirm(`Ban user ${report.target_author_id} from c/${slug}?`)) return;
    setBanning({ loading: true, done: false, error: null });
    try {
      await modBanUserFromCommunity(report.target_author_id, slug);
      setBanning({ loading: false, done: true, error: null });
    } catch (e: any) {
      setBanning({ loading: false, done: false, error: e.message });
    }
  }

  return (
    <div className="bg-white rounded-card border border-gray-200 p-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <ReasonBadge reason={report.reason} />
            <span className="text-xs text-muted">{timeAgo(report.created_at)}</span>
            <span className="text-xs text-muted">reported by <strong>{report.reporter_username}</strong></span>
          </div>
          <Link
            href={`/post/${report.target_id}`}
            className="font-semibold text-gray-900 hover:text-primary truncate block"
          >
            {report.target_title}
          </Link>
          <p className="text-xs text-muted mt-0.5">Post ID: {report.target_id}</p>
        </div>

        <div className="flex flex-wrap gap-2 shrink-0">
          {removing.done ? (
            <span className="text-xs text-green-600 font-medium self-center">Removed ✓</span>
          ) : (
            <ActionButton
              label={removing.loading ? 'Removing…' : 'Remove Post'}
              onClick={handleRemove}
              variant="danger"
              disabled={removing.loading}
            />
          )}

          <ActionButton
            label={pinning.loading ? '…' : isPinned ? 'Unpin' : 'Pin'}
            onClick={handlePin}
            variant="accent"
            disabled={pinning.loading}
          />

          {banning.done ? (
            <span className="text-xs text-green-600 font-medium self-center">Banned ✓</span>
          ) : (
            <ActionButton
              label={banning.loading ? 'Banning…' : 'Ban Author'}
              onClick={handleBan}
              variant="default"
              disabled={banning.loading}
            />
          )}
        </div>
      </div>
      {(removing.error || pinning.error || banning.error) && (
        <p className="mt-2 text-xs text-red-600">{removing.error || pinning.error || banning.error}</p>
      )}
    </div>
  );
}

// ── Comment report row ───────────────────────────────────────────────────────
function CommentReportRow({
  report,
  slug,
  onDismiss,
}: {
  report: CommentReport;
  slug: string;
  onDismiss: (id: string) => void;
}) {
  const [banning, setBanning] = useState<ActionState>({ loading: false, done: false, error: null });

  async function handleBan() {
    if (!confirm(`Ban user ${report.target_author_id} from c/${slug}?`)) return;
    setBanning({ loading: true, done: false, error: null });
    try {
      await modBanUserFromCommunity(report.target_author_id, slug);
      setBanning({ loading: false, done: true, error: null });
    } catch (e: any) {
      setBanning({ loading: false, done: false, error: e.message });
    }
  }

  return (
    <div className="bg-white rounded-card border border-gray-200 p-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <ReasonBadge reason={report.reason} />
            <span className="text-xs text-muted">{timeAgo(report.created_at)}</span>
            <span className="text-xs text-muted">reported by <strong>{report.reporter_username}</strong></span>
          </div>
          <p className="text-sm text-gray-800 line-clamp-2 font-medium">{report.target_body}</p>
          <p className="text-xs text-muted mt-0.5">Comment ID: {report.target_id}</p>
        </div>

        <div className="flex flex-wrap gap-2 shrink-0">
          {banning.done ? (
            <span className="text-xs text-green-600 font-medium self-center">Banned ✓</span>
          ) : (
            <ActionButton
              label={banning.loading ? 'Banning…' : 'Ban Author'}
              onClick={handleBan}
              variant="default"
              disabled={banning.loading}
            />
          )}
        </div>
      </div>
      {banning.error && (
        <p className="mt-2 text-xs text-red-600">{banning.error}</p>
      )}
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function ModQueuePage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const slug = params.slug;

  const [postReports, setPostReports] = useState<PostReport[]>([]);
  const [commentReports, setCommentReports] = useState<CommentReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) {
      router.replace('/login');
      return;
    }

    getModQueue(slug)
      .then((res) => {
        setPostReports(res.data?.post_reports ?? []);
        setCommentReports(res.data?.comment_reports ?? []);
        setLoading(false);
      })
      .catch((e: any) => {
        setError(e.message ?? 'Failed to load queue');
        setLoading(false);
      });
  }, [slug, router]);

  function dismissPostReport(id: string) {
    setPostReports((prev) => prev.filter((r) => r.id !== id));
  }

  function dismissCommentReport(id: string) {
    setCommentReports((prev) => prev.filter((r) => r.id !== id));
  }

  const total = postReports.length + commentReports.length;

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm text-muted mb-1">
          <Link href={`/c/${slug}`} className="hover:text-primary">c/{slug}</Link>
          <span>/</span>
          <span>Mod Queue</span>
        </div>
        <h1 className="font-display font-bold text-2xl text-gray-900">
          Moderation Queue
        </h1>
        {!loading && !error && (
          <p className="text-sm text-muted mt-1">
            {total === 0 ? 'All clear — no unresolved reports 🎉' : `${total} unresolved report${total !== 1 ? 's' : ''}`}
          </p>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-white rounded-card border border-gray-200 animate-pulse" />
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-card p-4 text-sm text-red-700">
          {error === 'Moderator access required'
            ? "You don't have moderator access to this community."
            : error}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && total === 0 && (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">✅</div>
          <p className="font-display font-semibold text-lg text-gray-700">Queue is empty lah!</p>
          <p className="text-sm text-muted mt-1">No unresolved reports for this community.</p>
          <Link href={`/c/${slug}`} className="mt-4 inline-block text-sm text-primary hover:underline">
            Back to community →
          </Link>
        </div>
      )}

      {/* Post reports */}
      {!loading && !error && postReports.length > 0 && (
        <section className="mb-8">
          <h2 className="font-display font-semibold text-base text-gray-800 mb-3 flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white text-xs font-bold">
              {postReports.length}
            </span>
            Reported Posts
          </h2>
          <div className="space-y-3">
            {postReports.map((r) => (
              <PostReportRow key={r.id} report={r} slug={slug} onDismiss={dismissPostReport} />
            ))}
          </div>
        </section>
      )}

      {/* Comment reports */}
      {!loading && !error && commentReports.length > 0 && (
        <section>
          <h2 className="font-display font-semibold text-base text-gray-800 mb-3 flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-accent text-white text-xs font-bold">
              {commentReports.length}
            </span>
            Reported Comments
          </h2>
          <div className="space-y-3">
            {commentReports.map((r) => (
              <CommentReportRow key={r.id} report={r} slug={slug} onDismiss={dismissCommentReport} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
