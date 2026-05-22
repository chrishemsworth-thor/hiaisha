import { Suspense } from 'react';
import { FeedTabs } from '@/components/posts/FeedTabs';
import { PostFeed } from '@/components/posts/PostFeed';
import { CommunityCard } from '@/components/communities/CommunityCard';
import { getPosts, getCommunities } from '@/lib/api';

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
        <div className="bg-white rounded-card border border-gray-200 p-4">
          <h2 className="font-display font-semibold text-sm mb-3">Top Makan Spots</h2>
          <Suspense fallback={null}>
            <TopCommunities />
          </Suspense>
        </div>
      </aside>
    </div>
  );
}
