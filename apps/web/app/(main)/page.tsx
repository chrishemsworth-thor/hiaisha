import { Suspense } from 'react';
import type { Metadata } from 'next';
import { FeedTabs } from '@/components/posts/FeedTabs';
import { PostFeed } from '@/components/posts/PostFeed';
import { CommunityCard } from '@/components/communities/CommunityCard';
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

export default function HomePage({ searchParams }: { searchParams: { sort?: string; time?: string } }) {
  const sort = searchParams.sort ?? 'hot';
  const time = searchParams.time ?? 'all';

  return (
    <div className="flex gap-6">
      <div className="flex-1 min-w-0">
        <Suspense fallback={null}>
          <FeedTabs />
        </Suspense>
        <div className="mt-4">
          <Suspense fallback={<PostFeed posts={[]} loading />}>
            <HomeFeed sort={sort} time={time} />
          </Suspense>
        </div>
      </div>
      <aside className="w-72 shrink-0 hidden lg:block space-y-4">
        {/* Welcome card */}
        <div className="bg-white rounded-card border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">🇲🇾</span>
            <h2 className="font-display font-bold text-sm">Selamat datang ke Hiaisha</h2>
          </div>
          <p className="text-xs text-muted leading-relaxed">
            Malaysia&apos;s community — discuss news, share opinions, laugh at memes, and connect with Malaysians everywhere. Cakap apa saja, bebas lah.
          </p>
          <div className="mt-3 flex gap-2">
            <a href="/register" className="flex-1 text-center text-xs py-1.5 bg-primary text-white rounded-full font-medium hover:bg-primary-dark">
              Join Free
            </a>
            <a href="/communities" className="flex-1 text-center text-xs py-1.5 border border-gray-300 rounded-full font-medium hover:border-primary hover:text-primary">
              Browse
            </a>
          </div>
        </div>
        {/* Top communities */}
        <div className="bg-white rounded-card border border-gray-200 p-4">
          <h2 className="font-display font-semibold text-sm mb-3">Top Communities</h2>
          <Suspense fallback={null}>
            <TopCommunities />
          </Suspense>
        </div>
      </aside>
    </div>
  );
}
