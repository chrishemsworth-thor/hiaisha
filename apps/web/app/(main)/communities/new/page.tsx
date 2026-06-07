'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createCommunity } from '@/lib/api';
import { isLoggedIn } from '@/lib/auth';

export default function NewCommunityPage() {
  const router = useRouter();
  const [slug, setSlug] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isLoggedIn()) router.push('/login');
  }, []);

  function handleSlugChange(e: React.ChangeEvent<HTMLInputElement>) {
    // Auto-format: lowercase, replace spaces/invalid chars with hyphens
    setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-'));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!slug || !name) { setError('Slug and name are required'); return; }
    if (!/^[a-z0-9-]{2,50}$/.test(slug)) {
      setError('Slug must be 2–50 characters: lowercase letters, numbers, hyphens only');
      return;
    }

    setPending(true);
    setError('');
    try {
      const res = await createCommunity({ slug, name: name.trim(), description: description.trim() || undefined });
      if (res.data) router.push(`/c/${res.data.slug}`);
    } catch (err: any) {
      setError(err.message ?? 'Failed to create community');
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="font-display font-bold text-2xl mb-1">Create a Community</h1>
      <p className="text-sm text-muted mb-6">
        Start a new space for people to share and discuss topics you care about.
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium mb-1">
            Slug <span className="text-muted font-normal">(used in the URL)</span>
          </label>
          <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden focus-within:border-primary transition-colors bg-white">
            <span className="px-3 py-2 text-sm text-muted bg-surface-bg border-r border-gray-300 shrink-0">
              /c/
            </span>
            <input
              type="text"
              value={slug}
              onChange={handleSlugChange}
              maxLength={50}
              className="flex-1 px-3 py-2 text-sm focus:outline-none bg-white"
              placeholder="nama-komuniti"
              required
            />
          </div>
          <p className="text-xs text-muted mt-1">2–50 characters. Lowercase letters, numbers, hyphens only.</p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Community Name</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            maxLength={100}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary transition-colors bg-white"
            placeholder="e.g. Komuniti Memasak Malaysia"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Description <span className="text-muted font-normal">(optional)</span>
          </label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            maxLength={500}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary transition-colors resize-none bg-white"
            placeholder="What is this community about?"
          />
          <p className="text-xs text-muted mt-0.5 text-right">{description.length}/500</p>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 py-2.5 border border-line rounded-lg text-sm font-medium text-ink hover:border-primary hover:text-primary transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={pending}
            className="flex-1 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark disabled:opacity-50 transition-colors"
          >
            {pending ? 'Creating...' : 'Create Community'}
          </button>
        </div>
      </form>
    </div>
  );
}
