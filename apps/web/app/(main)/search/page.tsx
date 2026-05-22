import { Suspense } from 'react';
import { PostFeed } from '@/components/posts/PostFeed';
import { search } from '@/lib/api';

async function SearchResults({ q, community, sort }: { q: string; community?: string; sort?: string }) {
  if (!q) return <p className="text-muted text-sm">Enter something to search lah!</p>;
  try {
    const res = await search({ q, community, sort });
    return <PostFeed posts={res.data?.data ?? []} />;
  } catch {
    return <PostFeed posts={[]} />;
  }
}

export default function SearchPage({ searchParams }: { searchParams: { q?: string; community?: string; sort?: string } }) {
  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="font-display font-bold text-xl mb-4">
        {searchParams.q ? `Results for "${searchParams.q}"` : 'Search'}
      </h1>
      <Suspense fallback={<PostFeed posts={[]} loading />}>
        <SearchResults q={searchParams.q ?? ''} community={searchParams.community} sort={searchParams.sort} />
      </Suspense>
    </div>
  );
}
