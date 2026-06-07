'use client';
import { useEffect, useState } from 'react';
import { getCommunities } from '@/lib/api';
import { CommunityCard } from '@/components/communities/CommunityCard';
import { useAuth } from '@/lib/use-auth';
import type { Community } from '@hiaisha/types';

type Tab = 'all' | 'joined';

export default function CommunitiesPage() {
  const { isLoggedIn } = useAuth();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [tab, setTab] = useState<Tab>('all');

  useEffect(() => {
    getCommunities()
      .then(res => setCommunities(res.data ?? []))
      .catch(() => setCommunities([]));
  }, []);

  const displayed = tab === 'joined'
    ? communities.filter(c => c.is_member)
    : communities;

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="font-display font-bold text-2xl mb-1">Communities</h1>
      <p className="text-muted text-sm mb-4">Find your tribe — join a community and start sharing lah.</p>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-line">
        <TabButton active={tab === 'all'} onClick={() => setTab('all')}>Semua</TabButton>
        {isLoggedIn && (
          <TabButton active={tab === 'joined'} onClick={() => setTab('joined')}>Joined</TabButton>
        )}
      </div>

      {tab === 'joined' && displayed.length === 0 ? (
        <p className="text-ink-muted text-sm py-8 text-center">
          You haven't joined any communities yet.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayed.map(community => (
            <CommunityCard key={community.id} community={community} />
          ))}
        </div>
      )}
    </div>
  );
}

function TabButton({ active, onClick, children }: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-sm font-display font-semibold border-b-2 -mb-px transition-colors ${
        active
          ? 'border-primary text-primary'
          : 'border-transparent text-ink-muted hover:text-ink'
      }`}
    >
      {children}
    </button>
  );
}
