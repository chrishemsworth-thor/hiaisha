'use client';
import { useRouter, useSearchParams } from 'next/navigation';
import clsx from 'clsx';

const SORT_OPTIONS = [
  { value: 'hot', label: 'Hot' },
  { value: 'new', label: 'New' },
  { value: 'top', label: 'Top' },
] as const;

const TIME_OPTIONS = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'all', label: 'All Time' },
] as const;

export function FeedTabs() {
  const router = useRouter();
  const params = useSearchParams();
  const sort = params.get('sort') ?? 'hot';
  const time = params.get('time') ?? 'all';

  function setSort(value: string) {
    const p = new URLSearchParams(params.toString());
    p.set('sort', value);
    if (value !== 'top') p.delete('time');
    router.push(`?${p.toString()}`);
  }

  function setTime(value: string) {
    const p = new URLSearchParams(params.toString());
    p.set('time', value);
    router.push(`?${p.toString()}`);
  }

  return (
    <div className="flex items-center gap-1 bg-white rounded-card border border-gray-200 p-1">
      {SORT_OPTIONS.map(opt => (
        <button
          key={opt.value}
          onClick={() => setSort(opt.value)}
          className={clsx(
            'px-4 py-1.5 text-sm rounded-md font-medium transition-colors',
            sort === opt.value
              ? 'bg-primary text-white'
              : 'text-muted hover:text-[#1A1A1A] hover:bg-gray-100'
          )}
        >
          {opt.label}
        </button>
      ))}

      {sort === 'top' && (
        <select
          value={time}
          onChange={e => setTime(e.target.value)}
          className="ml-2 text-sm border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:border-primary bg-white"
        >
          {TIME_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      )}
    </div>
  );
}
