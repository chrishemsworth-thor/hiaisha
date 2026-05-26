export function LocationBadge({ location }: { location: string }) {
  return (
    <span
      className="inline-flex items-center gap-1 text-xs rounded-pill px-2 py-0.5 font-medium"
      style={{ background: 'var(--accent-soft)', color: '#8a5d0a' }}
    >
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
      {location}
    </span>
  );
}
