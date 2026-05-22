'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getCommunities, createPost } from '@/lib/api';
import { isLoggedIn } from '@/lib/auth';
import type { Community } from '@hiaisha/types';

export default function SubmitPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultCommunity = searchParams.get('community') ?? '';

  const [communities, setCommunities] = useState<Community[]>([]);
  const [communityId, setCommunityId] = useState('');
  const [postType, setPostType] = useState<'text' | 'image'>('text');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [locationTag, setLocationTag] = useState('');
  const [tags, setTags] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isLoggedIn()) { router.push('/login'); return; }
    getCommunities().then(res => {
      const list = res.data ?? [];
      setCommunities(list);
      if (defaultCommunity) {
        const found = list.find(c => c.slug === defaultCommunity);
        if (found) setCommunityId(found.id);
      }
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !communityId) { setError('Title and community are required lah!'); return; }
    setPending(true);
    setError('');
    try {
      const res = await createPost({
        title: title.trim(),
        body: body.trim() || undefined,
        post_type: postType,
        community_id: communityId,
        location_tag: locationTag.trim() || undefined,
        tags: tags.split(',').map(t => t.trim()).filter(Boolean).slice(0, 5),
      });
      if (res.data) router.push(`/post/${res.data.id}`);
    } catch (err: any) {
      setError(err.message ?? 'Failed to create post');
    } finally { setPending(false); }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="font-display font-bold text-2xl mb-6">Create a Post</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Community *</label>
          <select
            value={communityId}
            onChange={e => setCommunityId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary bg-white"
            required
          >
            <option value="">Choose a community...</option>
            {communities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        <div className="flex gap-2">
          {(['text', 'image'] as const).map(t => (
            <button
              key={t}
              type="button"
              onClick={() => setPostType(t)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium capitalize transition-colors ${postType === t ? 'bg-primary text-white' : 'border border-gray-300 text-muted hover:border-primary'}`}
            >
              {t === 'text' ? '📝 Text' : '🖼️ Image'}
            </button>
          ))}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Title *</label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            maxLength={300}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary"
            placeholder="What's the makan news?"
            required
          />
          <p className="text-xs text-muted mt-0.5 text-right">{title.length}/300</p>
        </div>

        {postType === 'text' && (
          <div>
            <label className="block text-sm font-medium mb-1">Body (optional)</label>
            <textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              rows={6}
              maxLength={10000}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary resize-none"
              placeholder="Tell us more lah..."
            />
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Location (optional)</label>
            <input
              type="text"
              value={locationTag}
              onChange={e => setLocationTag(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary"
              placeholder="e.g. Bangsar, KL"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Tags (optional, comma separated)</label>
            <input
              type="text"
              value={tags}
              onChange={e => setTags(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary"
              placeholder="nasi lemak, must try"
            />
          </div>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={pending}
          className="w-full py-2.5 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark disabled:opacity-50"
        >
          {pending ? 'Posting...' : 'Post lah!'}
        </button>
      </form>
    </div>
  );
}
