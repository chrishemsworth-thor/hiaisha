'use client';
import { useEffect, useState } from 'react';
import { NotificationItem } from '@/components/ui/NotificationItem';
import { getNotifications, markAllNotificationsRead } from '@/lib/api';
import type { Notification } from '@hiaisha/types';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getNotifications().then(res => {
      setNotifications(res.data?.notifications ?? []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  async function handleMarkAll() {
    await markAllNotificationsRead();
    setNotifications(ns => ns.map(n => ({ ...n, is_read: 1 })));
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="font-display font-bold text-2xl">Notifications</h1>
        {notifications.some(n => !n.is_read) && (
          <button onClick={handleMarkAll} className="text-sm text-primary hover:underline">Mark all read</button>
        )}
      </div>
      {loading ? (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => <div key={i} className="h-16 bg-white rounded-lg animate-pulse" />)}
        </div>
      ) : notifications.length ? (
        <div className="space-y-1 bg-white rounded-card border border-gray-200 overflow-hidden divide-y divide-gray-100">
          {notifications.map(n => <NotificationItem key={n.id} notification={n} />)}
        </div>
      ) : (
        <p className="text-center text-muted py-12">No notifications yet lah!</p>
      )}
    </div>
  );
}
