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
      <h1 className="font-display font-bold text-2xl mb-2">Communities</h1>
      <p className="text-muted text-sm mb-6">Find your tribe — join a community and start sharing lah.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {communities.map(community => (
          <CommunityCard key={community.id} community={community} />
        ))}
      </div>
    </div>
  );
}
