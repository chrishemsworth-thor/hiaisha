import { Suspense } from 'react';
import type { Metadata } from 'next';
import { FeedTabs } from '@/components/posts/FeedTabs';
import { PostFeed } from '@/components/posts/PostFeed';
import { CommunityCard } from '@/components/communities/CommunityCard';
import { WelcomeCard } from '@/components/communities/WelcomeCard';
import { getPosts, getCommunities } from '@/lib/api';

export const metadata: Metadata = {
  title: 'Hiaisha — Malaysian Community',
  description:
    'Discover what Malaysians are talking about. Share news, opinions, memes, and stories — from KL to Kota Kinabalu.',
  openGraph: {
    title: 'Hiaisha — Malaysian Community',
    description:
      'Discover what Malaysians are talking about. Share news, opinions, memes, and stories — from KL to Kota Kinabalu.',
    url: 'https://hiaisha.com',
    siteName: 'Hiaisha',
    type: 'website',
    images: [
      {
        url: '/og-default.png',
        width: 1200,
        height: 630,
        alt: 'Hiaisha — Malaysian Community',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Hiaisha — Malaysian Community',
    description:
      'Discover what Malaysians are talking about. Share news, opinions, memes, and stories — from KL to Kota Kinabalu.',
    images: ['/og-default.png'],
  },
};

async function HomeFeed({ sort, time }: { sort: string; time: string }) {
  try {
    const res = await getPosts({ sort: sort as any, time: time as any, limit: '20' });
    return <PostFeed posts={res.data?.data ?? []} />;
  } catch {
    return <PostFeed posts={[]} />;
  }
}

async function TopCommunities() {
  try {
    const res = await getCommunities();
    const communities = (res.data ?? []).slice(0, 6);
    return (
      <div className="space-y-2">
        {communities.map(c => <CommunityCard key={c.id} community={c} />)}
      </div>
    );
  } catch {
    return null;
  }
}

export default function HomePage({
  searchParams,
}: {
  searchParams: { sort?: string; time?: string };
}) {
  const sort = searchParams.sort ?? 'hot';
  const time = searchParams.time ?? 'all';

  return (
    <div className="flex gap-6">
      {/* ── Feed ── */}
      <div className="flex-1 min-w-0">
        <Suspense fallback={null}>
          <FeedTabs />
        </Suspense>
        <div className="mt-4 space-y-3">
          <Suspense fallback={<PostFeed posts={[]} loading />}>
            <HomeFeed sort={sort} time={time} />
          </Suspense>
        </div>
      </div>

      {/* ── Sidebar ── */}
      <aside className="w-72 shrink-0 hidden lg:flex flex-col gap-4">
        {/* Welcome card — shown to everyone; WelcomeCard is guest-aware */}
        <WelcomeCard />

        {/* Trending/top communities */}
        <div className="bg-surface rounded-card border border-line shadow-warm-sm p-4">
          <div className="flex items-center gap-2 mb-3">
            <svg className="w-4 h-4 text-chili" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 3c1 4 4 5 4 9a4 4 0 0 1-8 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3 0-5 0-8z" />
            </svg>
            <h2 className="font-display font-bold text-sm text-ink">Topik popular</h2>
          </div>
          <Suspense fallback={null}>
            <TopCommunities />
          </Suspense>
        </div>

        {/* Footer links */}
        <div className="text-xs text-ink-muted flex flex-wrap gap-x-3 gap-y-1 px-1">
          <a href="/terms" className="hover:text-primary transition-colors">Terms</a>
          <a href="/privacy" className="hover:text-primary transition-colors">Privacy</a>
          <span>© 2026 Hiaisha</span>
        </div>
      </aside>
    </div>
  );
}
