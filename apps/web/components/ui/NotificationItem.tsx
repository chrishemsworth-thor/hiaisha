import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { UserAvatar } from './UserAvatar';
import type { Notification } from '@hiaisha/types';

interface Props {
  notification: Notification & {
    actor?: { id: string; username: string; avatar_url: string | null };
    post?: { id: string; title: string } | null;
  };
}

const typeLabels: Record<string, string> = {
  comment_reply: 'replied to your comment',
  post_reply: 'commented on your post',
  mention: 'mentioned you',
};

export function NotificationItem({ notification }: Props) {
  const label = typeLabels[notification.type] ?? 'interacted with you';
  const timeAgo = formatDistanceToNow(new Date(notification.created_at * 1000), { addSuffix: true });

  return (
    <div className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${notification.is_read ? 'bg-transparent' : 'bg-accent/5 border border-accent/20'}`}>
      {notification.is_read === 0 && (
        <div className="w-2 h-2 rounded-full bg-accent mt-2 shrink-0" />
      )}
      {notification.actor && (
        <UserAvatar
          username={notification.actor.username}
          avatarUrl={notification.actor.avatar_url}
          size="sm"
        />
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm">
          {notification.actor && (
            <Link href={`/u/${notification.actor.username}`} className="font-semibold hover:text-primary">
              {notification.actor.username}
            </Link>
          )}{' '}
          <span className="text-muted">{label}</span>
          {notification.post && (
            <>
              {': '}
              <Link href={`/post/${notification.post.id}`} className="font-medium hover:text-primary truncate">
                {notification.post.title}
              </Link>
            </>
          )}
        </p>
        <p className="text-xs text-muted mt-0.5">{timeAgo}</p>
      </div>
    </div>
  );
}
