import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { FeedTabs } from '@/components/posts/FeedTabs';
import { PostFeed } from '@/components/posts/PostFeed';
import { CommunitySidebar } from '@/components/communities/CommunitySidebar';
import { getCommunity, getCommunityPosts } from '@/lib/api';

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  try {
    const res = await getCommunity(params.slug);
    const community = res.data;
    if (!community) return {};

    const title = `${community.name} — Hiaisha`;
    const description =
      community.description ||
      `Join the ${community.name} community on Hiaisha. Discover Malaysian food discussions, reviews, and makan spots.`;
    const ogImage = community.banner_url ?? '/og-default.png';

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        url: `https://hiaisha.com/c/${params.slug}`,
        siteName: 'Hiaisha',
        type: 'website',
        images: [
          {
            url: ogImage,
            width: 1200,
            height: 630,
            alt: community.name,
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [ogImage],
      },
    };
  } catch {
    return {};
  }
}

async function CommunityPosts({ slug, sort, time }: { slug: string; sort: string; time: string }) {
  try {
    const res = await getCommunityPosts(slug, { sort: sort as any, time: time as any });
    return <PostFeed posts={res.data?.data ?? []} />;
  } catch {
    return <PostFeed posts={[]} />;
  }
}

export default async function CommunityPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { sort?: string; time?: string };
}) {
  let community;
  try {
    const res = await getCommunity(params.slug);
    community = res.data;
  } catch {
    notFound();
  }
  if (!community) notFound();

  const sort = searchParams.sort ?? 'hot';
  const time = searchParams.time ?? 'all';

  return (
    <div>
      {community.banner_url && (
        <div className="w-full h-32 bg-primary mb-6 rounded-xl overflow-hidden">
          <img src={community.banner_url} alt={community.name} className="w-full h-full object-cover" />
        </div>
      )}
      <div className="flex gap-6">
        <div className="flex-1 min-w-0">
          <h1 className="font-display font-bold text-2xl mb-4">{community.name}</h1>
          <Suspense fallback={null}><FeedTabs /></Suspense>
          <div className="mt-4">
            <Suspense fallback={<PostFeed posts={[]} loading />}>
              <CommunityPosts slug={params.slug} sort={sort} time={time} />
            </Suspense>
          </div>
        </div>
        <aside className="w-72 shrink-0 hidden lg:block">
          <CommunitySidebar community={community} />
        </aside>
      </div>
    </div>
  );
}
