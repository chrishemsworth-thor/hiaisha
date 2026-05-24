'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getCommunities, createPost, uploadImage } from '@/lib/api';
import { isLoggedIn } from '@/lib/auth';
import type { Community } from '@hiaisha/types';
import Image from 'next/image';

const MAX_IMAGES = 4;
const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

interface ImagePreview {
  file: File;
  previewUrl: string;
}

export default function SubmitPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultCommunity = searchParams.get('community') ?? '';
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [communities, setCommunities] = useState<Community[]>([]);
  const [communityId, setCommunityId] = useState('');
  const [postType, setPostType] = useState<'text' | 'image'>('text');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [locationTag, setLocationTag] = useState('');
  const [tags, setTags] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  // Image state
  const [imagePreviews, setImagePreviews] = useState<ImagePreview[]>([]);
  const [uploadErrors, setUploadErrors] = useState<string[]>([]);
  const [dragOver, setDragOver] = useState(false);

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

  // Clean up preview URLs on unmount
  useEffect(() => {
    return () => {
      imagePreviews.forEach(img => URL.revokeObjectURL(img.previewUrl));
    };
  }, []);

  function validateAndAddFiles(files: File[]) {
    const errors: string[] = [];
    const valid: ImagePreview[] = [];

    for (const file of files) {
      if (imagePreviews.length + valid.length >= MAX_IMAGES) {
        errors.push(`Maximum ${MAX_IMAGES} images allowed`);
        break;
      }
      if (!ALLOWED_TYPES.includes(file.type)) {
        errors.push(`${file.name}: only JPEG, PNG, WebP allowed`);
        continue;
      }
      if (file.size > MAX_SIZE) {
        errors.push(`${file.name}: must be 5MB or less`);
        continue;
      }
      valid.push({ file, previewUrl: URL.createObjectURL(file) });
    }

    setUploadErrors(errors);
    if (valid.length) {
      setImagePreviews(prev => [...prev, ...valid].slice(0, MAX_IMAGES));
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length) validateAndAddFiles(files);
    // Reset input so same file can be re-added after removal
    e.target.value = '';
  }

  function handleRemoveImage(index: number) {
    setImagePreviews(prev => {
      URL.revokeObjectURL(prev[index].previewUrl);
      return prev.filter((_, i) => i !== index);
    });
    setUploadErrors([]);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(true);
  }

  function handleDragLeave() {
    setDragOver(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files).filter(f => ALLOWED_TYPES.includes(f.type));
    if (files.length) validateAndAddFiles(files);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !communityId) { setError('Title and community are required lah!'); return; }
    if (postType === 'image' && imagePreviews.length === 0) {
      setError('Please add at least one image for an image post');
      return;
    }
    setPending(true);
    setError('');

    try {
      // Upload images first
      let imageUrls: string[] = [];
      if (postType === 'image' && imagePreviews.length > 0) {
        const uploads = await Promise.all(
          imagePreviews.map(img => uploadImage(img.file))
        );
        imageUrls = uploads;
      }

      const res = await createPost({
        title: title.trim(),
        body: body.trim() || undefined,
        post_type: postType,
        community_id: communityId,
        location_tag: locationTag.trim() || undefined,
        tags: tags.split(',').map(t => t.trim()).filter(Boolean).slice(0, 5),
        image_urls: imageUrls.length ? imageUrls : undefined,
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
              onClick={() => { setPostType(t); setImagePreviews([]); setUploadErrors([]); }}
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

        {postType === 'image' && (
          <div className="space-y-3">
            <label className="block text-sm font-medium">
              Images * <span className="text-muted font-normal">(up to {MAX_IMAGES}, max 5MB each — JPEG, PNG, WebP)</span>
            </label>

            {/* Image previews grid */}
            {imagePreviews.length > 0 && (
              <div className="grid grid-cols-2 gap-2">
                {imagePreviews.map((img, i) => (
                  <div key={i} className="relative group rounded-lg overflow-hidden aspect-square bg-gray-100">
                    <img
                      src={img.previewUrl}
                      alt={`Preview ${i + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(i)}
                      className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-white/90 text-gray-700 hover:bg-red-500 hover:text-white flex items-center justify-center text-sm font-bold opacity-0 group-hover:opacity-100 transition-all shadow"
                    >
                      ×
                    </button>
                    <span className="absolute bottom-1.5 left-1.5 bg-black/50 text-white text-xs px-1.5 py-0.5 rounded">
                      {i + 1}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Dropzone */}
            {imagePreviews.length < MAX_IMAGES && (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  dragOver
                    ? 'border-primary bg-red-50'
                    : 'border-gray-300 hover:border-primary hover:bg-surface-bg'
                }`}
              >
                <div className="text-3xl mb-2">🖼️</div>
                <p className="text-sm font-medium text-[#1A1A1A]">
                  Drop images here or <span className="text-primary">browse</span>
                </p>
                <p className="text-xs text-muted mt-1">
                  {imagePreviews.length > 0
                    ? `${MAX_IMAGES - imagePreviews.length} more image${MAX_IMAGES - imagePreviews.length !== 1 ? 's' : ''} allowed`
                    : `Up to ${MAX_IMAGES} images`}
                </p>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={handleFileChange}
              className="hidden"
            />

            {uploadErrors.length > 0 && (
              <div className="space-y-1">
                {uploadErrors.map((err, i) => (
                  <p key={i} className="text-xs text-red-500">{err}</p>
                ))}
              </div>
            )}
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
          {pending ? (postType === 'image' && imagePreviews.length > 0 ? 'Uploading & posting...' : 'Posting...') : 'Post lah!'}
        </button>
      </form>
    </div>
  );
}
