import Link from 'next/link';
import { getCommunities } from '@/lib/api';
import { CommunityCard } from '@/components/communities/CommunityCard';

export default async function CommunitiesPage() {
  let communities = [];
  try {
    const res = await getCommunities();
    communities = res.data ?? [];
  } catch {
    communities = [];
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-2">
        <h1 className="font-display font-bold text-2xl">Communities</h1>
        <Link
          href="/communities/new"
          className="text-sm px-4 py-1.5 bg-primary text-white rounded-pill font-display font-bold hover:bg-primary-600 transition-colors"
        >
          + Create
        </Link>
      </div>
      <p className="text-muted text-sm mb-6">Find your tribe — join a community and start sharing lah.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {communities.map(community => (
          <CommunityCard key={community.id} community={community} />
        ))}
      </div>
    </div>
  );
}
