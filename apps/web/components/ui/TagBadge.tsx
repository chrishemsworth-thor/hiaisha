import Link from 'next/link';

export function TagBadge({ tag }: { tag: string }) {
  return (
    <Link href={`/search?q=${encodeURIComponent(tag)}`}>
      <span className="inline-block px-2 py-0.5 text-xs rounded-pill bg-surface-bg border border-line text-ink-muted hover:border-primary hover:text-primary transition-colors font-mono">
        #{tag}
      </span>
    </Link>
  );
}
