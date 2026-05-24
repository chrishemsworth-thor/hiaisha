'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  getAdminReports, resolveReport, globalBanUser, AdminReport,
} from '@/lib/api';
import { getCurrentUser } from '@/lib/auth';

// ── Helpers ──────────────────────────────────────────────────────────────────

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

const REASON_COLOURS: Record<string, string> = {
  spam: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  misinformation: 'bg-orange-100 text-orange-800 border-orange-200',
  'off-topic': 'bg-blue-100 text-blue-800 border-blue-200',
  offensive: 'bg-red-100 text-red-800 border-red-200',
};

// ── Report row ───────────────────────────────────────────────────────────────
function ReportRow({
  report,
  onResolved,
}: {
  report: AdminReport;
  onResolved: (id: string) => void;
}) {
  const [resolving, setResolving] = useState(false);
  const [banning, setBanning] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleResolve() {
    setResolving(true);
    setError(null);
    try {
      await resolveReport(report.id);
      setDone('resolved');
      setTimeout(() => onResolved(report.id), 500);
    } catch (e: any) {
      setError(e.message ?? 'Failed to resolve');
      setResolving(false);
    }
  }

  async function handleBan() {
    const authorId = report.target_author_id;
    if (!authorId) {
      setError('Target author not found');
      return;
    }
    if (!confirm(`Globally ban the author of this ${report.target_type}? This will lock them out of the platform.`)) return;
    setBanning(true);
    setError(null);
    try {
      await globalBanUser(authorId);
      setDone('banned');
    } catch (e: any) {
      setError(e.message ?? 'Failed to ban user');
      setBanning(false);
    }
  }

  const targetLink = report.target_type === 'post'
    ? `/post/${report.target_id}`
    : `/post/unknown#comment-${report.target_id}`;

  return (
    <tr className="border-b border-gray-100 hover:bg-surface-warm transition-colors">
      {/* Type */}
      <td className="px-4 py-3 whitespace-nowrap">
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${
          report.target_type === 'post'
            ? 'bg-purple-50 text-purple-700 border-purple-200'
            : 'bg-teal-50 text-teal-700 border-teal-200'
        }`}>
          {report.target_type}
        </span>
      </td>

      {/* Target */}
      <td className="px-4 py-3 max-w-xs">
        <Link href={targetLink} className="text-xs font-mono text-primary hover:underline block truncate" target="_blank">
          {report.target_id.slice(0, 14)}…
        </Link>
        {report.target_preview && (
          <p className="text-xs text-gray-600 mt-0.5 line-clamp-1">{report.target_preview}</p>
        )}
      </td>

      {/* Reason */}
      <td className="px-4 py-3 whitespace-nowrap">
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${REASON_COLOURS[report.reason] ?? 'bg-gray-100 text-gray-700 border-gray-200'}`}>
          {REASON_LABELS[report.reason] ?? report.reason}
        </span>
      </td>

      {/* Reporter */}
      <td className="px-4 py-3 text-sm text-gray-700">
        <span className="font-medium">{report.reporter_username}</span>
      </td>

      {/* Age */}
      <td className="px-4 py-3 text-xs text-muted whitespace-nowrap">
        {timeAgo(report.created_at)}
      </td>

      {/* Actions */}
      <td className="px-4 py-3">
        {done === 'resolved' ? (
          <span className="text-xs text-green-600 font-medium">Resolved ✓</span>
        ) : done === 'banned' ? (
          <span className="text-xs text-red-600 font-medium">User banned ✓</span>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={handleResolve}
              disabled={resolving || banning}
              className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-green-600 text-white hover:bg-green-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {resolving ? 'Resolving…' : 'Resolve'}
            </button>
            <button
              onClick={handleBan}
              disabled={resolving || banning}
              className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary text-white hover:bg-primary-dark transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {banning ? 'Banning…' : 'Ban User'}
            </button>
          </div>
        )}
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      </td>
    </tr>
  );
}

// ── Stats card ───────────────────────────────────────────────────────────────
function StatCard({ label, value, colour }: { label: string; value: number; colour: string }) {
  return (
    <div className="bg-white rounded-card border border-gray-200 p-4">
      <p className="text-xs text-muted font-medium uppercase tracking-wide">{label}</p>
      <p className={`font-display font-bold text-3xl mt-1 ${colour}`}>{value}</p>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function AdminPage() {
  const router = useRouter();
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'post' | 'comment'>('all');

  const fetchReports = useCallback(async (nextCursor?: string) => {
    try {
      const res = await getAdminReports(nextCursor);
      const data = res.data;
      if (nextCursor) {
        setReports((prev) => [...prev, ...(data?.data ?? [])]);
      } else {
        setReports(data?.data ?? []);
      }
      setCursor(data?.cursor ?? null);
      setHasMore(data?.hasMore ?? false);
    } catch (e: any) {
      setError(e.message ?? 'Failed to load reports');
    }
  }, []);

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) {
      router.replace('/login');
      return;
    }
    if (!user.is_admin) {
      setError('Admin access required');
      setLoading(false);
      return;
    }
    fetchReports().finally(() => setLoading(false));
  }, [fetchReports, router]);

  async function loadMore() {
    if (!cursor || loadingMore) return;
    setLoadingMore(true);
    await fetchReports(cursor);
    setLoadingMore(false);
  }

  function onReportResolved(id: string) {
    setReports((prev) => prev.filter((r) => r.id !== id));
  }

  const filtered = filter === 'all' ? reports : reports.filter((r) => r.target_type === filter);

  const postCount = reports.filter((r) => r.target_type === 'post').length;
  const commentCount = reports.filter((r) => r.target_type === 'comment').length;

  const reasonCounts = reports.reduce<Record<string, number>>((acc, r) => {
    acc[r.reason] = (acc[r.reason] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-display font-bold text-2xl text-gray-900">
          Admin Panel
        </h1>
        <p className="text-sm text-muted mt-1">Site-wide moderation · All unresolved reports</p>
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-card p-5 text-sm text-red-700 mb-6">
          <p className="font-semibold mb-1">Access denied</p>
          <p>{error}</p>
          {error === 'Admin access required' && (
            <Link href="/" className="mt-3 inline-block text-primary hover:underline text-xs">
              ← Back to home
            </Link>
          )}
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 bg-white rounded-card border border-gray-200 animate-pulse" />
            ))}
          </div>
          <div className="h-64 bg-white rounded-card border border-gray-200 animate-pulse" />
        </div>
      )}

      {!loading && !error && (
        <>
          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <StatCard label="Total Reports" value={reports.length} colour="text-gray-900" />
            <StatCard label="Post Reports" value={postCount} colour="text-purple-600" />
            <StatCard label="Comment Reports" value={commentCount} colour="text-teal-600" />
            <StatCard label="Spam" value={reasonCounts.spam ?? 0} colour="text-yellow-600" />
          </div>

          {/* Reason breakdown */}
          {reports.length > 0 && (
            <div className="bg-white rounded-card border border-gray-200 p-4 mb-6">
              <h2 className="font-display font-semibold text-sm text-gray-700 mb-3">Breakdown by Reason</h2>
              <div className="flex flex-wrap gap-3">
                {Object.entries(reasonCounts).map(([reason, count]) => (
                  <div key={reason} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium ${REASON_COLOURS[reason] ?? 'bg-gray-100 text-gray-700 border-gray-200'}`}>
                    <span>{REASON_LABELS[reason] ?? reason}</span>
                    <span className="font-bold">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Filter tabs */}
          <div className="flex items-center gap-1 mb-4">
            {(['all', 'post', 'comment'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
                  filter === f
                    ? 'bg-primary text-white'
                    : 'text-gray-600 hover:bg-surface-bg'
                }`}
              >
                {f === 'all' ? `All (${reports.length})` : f === 'post' ? `Posts (${postCount})` : `Comments (${commentCount})`}
              </button>
            ))}
          </div>

          {/* Empty state */}
          {filtered.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-5xl mb-4">🎉</div>
              <p className="font-display font-semibold text-lg text-gray-700">Nothing to see here!</p>
              <p className="text-sm text-muted mt-1">
                {reports.length === 0 ? 'No unresolved reports across the platform.' : `No ${filter} reports.`}
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-card border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-surface-bg border-b border-gray-200">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wide">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wide">Target</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wide">Reason</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wide">Reporter</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wide">Age</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wide">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((report) => (
                      <ReportRow key={report.id} report={report} onResolved={onReportResolved} />
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Load more */}
              {hasMore && (
                <div className="px-4 py-3 border-t border-gray-100 flex justify-center">
                  <button
                    onClick={loadMore}
                    disabled={loadingMore}
                    className="text-sm text-primary hover:underline disabled:opacity-50"
                  >
                    {loadingMore ? 'Loading…' : 'Load more reports'}
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
