'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/use-auth';

// ─── SVG icons (inline, same style as design: 1.75px stroke, rounded) ────────

function HomeIcon({ filled }: { filled?: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinejoin="round">
      <path d="M4 11l8-7 8 7v9h-5v-6h-6v6H4z" fill={filled ? 'currentColor' : 'none'} />
    </svg>
  );
}

function CompassIcon({ filled }: { filled?: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinejoin="round">
      <circle cx="12" cy="12" r="8.5" />
      <path d="M14.5 9.5L11 11l-1.5 3.5L13 13z" fill={filled ? 'currentColor' : 'none'} />
    </svg>
  );
}

function BellIcon({ filled }: { filled?: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 16V10a6 6 0 0 1 12 0v6l1.5 2h-15z" fill={filled ? 'currentColor' : 'none'} />
      <path d="M10 21h4" />
    </svg>
  );
}

function UserIcon({ filled }: { filled?: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round">
      <circle cx="12" cy="8" r="3.5" fill={filled ? 'currentColor' : 'none'} />
      <path d="M5 20c1-4 4-6 7-6s6 2 7 6" />
    </svg>
  );
}

// ─── Tab definitions ──────────────────────────────────────────────────────────

interface Tab {
  id: string;
  href: string;
  label: string;
  icon: (active: boolean) => React.ReactNode;
  primary?: boolean;
  authHref?: string; // redirect to login if not authenticated
}

// ─── Component ────────────────────────────────────────────────────────────────

export function BottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();

  function isActive(href: string) {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  }

  const tabs: Tab[] = [
    {
      id: 'home',
      href: '/',
      label: 'Home',
      icon: (a) => <HomeIcon filled={a} />,
    },
    {
      id: 'spots',
      href: '/communities',
      label: 'Topik',
      icon: (a) => <CompassIcon filled={a} />,
    },
    {
      id: 'submit',
      href: '/submit',
      label: '',
      icon: () => null,
      primary: true,
      authHref: '/login',
    },
    {
      id: 'notif',
      href: '/notifications',
      label: 'Inbox',
      icon: (a) => <BellIcon filled={a} />,
      authHref: '/login',
    },
    {
      id: 'me',
      href: user ? `/u/${user.username}` : '/login',
      label: 'Me',
      icon: (a) => <UserIcon filled={a} />,
    },
  ];

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-50 sm:hidden flex items-center justify-around bg-surface border-t border-line"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 8px)', paddingTop: 8 }}
      aria-label="Mobile navigation"
    >
      {tabs.map((tab) => {
        if (tab.primary) {
          const href = !user && tab.authHref ? tab.authHref : tab.href;
          return (
            <Link
              key={tab.id}
              href={href}
              aria-label="Submit post"
              className="flex items-center justify-center rounded-[18px] bg-primary text-white"
              style={{
                width: 52, height: 52,
                boxShadow: '0 6px 16px -4px rgba(79,61,224,0.5)',
                transform: 'translateY(-8px)',
              }}
            >
              {/* Plus icon */}
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </Link>
          );
        }

        const href = !user && tab.authHref ? tab.authHref : tab.href;
        const active = isActive(tab.href);

        return (
          <Link
            key={tab.id}
            href={href}
            className="relative flex flex-col items-center gap-0.5 px-2.5 py-1.5 min-w-[56px]"
            style={{ color: active ? 'var(--primary)' : 'var(--text-soft)' }}
            aria-current={active ? 'page' : undefined}
          >
            {tab.icon(active)}
            {tab.label && (
              <span className="font-display font-semibold" style={{ fontSize: 10.5 }}>
                {tab.label}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
