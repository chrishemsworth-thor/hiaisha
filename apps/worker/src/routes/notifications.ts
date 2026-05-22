import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth';

type Env = {
  DB: D1Database;
  IMAGES: R2Bucket;
  JWT_SECRET: string;
  FRONTEND_URL: string;
};

type Variables = {
  userId: string | undefined;
  user: { sub: string; username: string; is_admin: number; iat: number; exp: number } | undefined;
};

const notifications = new Hono<{ Bindings: Env; Variables: Variables }>();

// GET /notifications — get notifications for current user
notifications.get('/', authMiddleware, async (c) => {
  const userId = c.get('userId');
  const limit = Math.min(parseInt(c.req.query('limit') ?? '30'), 100);
  const unreadOnly = c.req.query('unread') === 'true';

  let query = `
    SELECT n.*,
      u.username as actor_username, u.avatar_url as actor_avatar,
      p.title as post_title
    FROM notifications n
    LEFT JOIN users u ON n.actor_id = u.id
    LEFT JOIN posts p ON n.post_id = p.id
    WHERE n.user_id = ?
  `;
  const params: (string | number)[] = [userId];

  if (unreadOnly) {
    query += ' AND n.is_read = 0';
  }

  query += ' ORDER BY n.created_at DESC LIMIT ?';
  params.push(limit);

  const result = await c.env.DB.prepare(query).bind(...params).all<{
    id: string; user_id: string; type: string; actor_id: string;
    post_id: string | null; comment_id: string | null;
    is_read: number; created_at: number;
    actor_username: string; actor_avatar: string | null;
    post_title: string | null;
  }>();

  const unreadCount = await c.env.DB.prepare(
    'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0'
  ).bind(userId).first<{ count: number }>();

  const data = (result.results ?? []).map(n => ({
    id: n.id,
    user_id: n.user_id,
    type: n.type,
    actor_id: n.actor_id,
    post_id: n.post_id,
    comment_id: n.comment_id,
    is_read: n.is_read,
    created_at: n.created_at,
    actor: { id: n.actor_id, username: n.actor_username, avatar_url: n.actor_avatar },
    post: n.post_id ? { id: n.post_id, title: n.post_title ?? '' } : null,
  }));

  return c.json({ success: true, data: { notifications: data, unread_count: unreadCount?.count ?? 0 } });
});

// POST /notifications/read-all — mark all as read
notifications.post('/read-all', authMiddleware, async (c) => {
  const userId = c.get('userId');

  await c.env.DB.prepare(
    'UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0'
  ).bind(userId).run();

  return c.json({ success: true, data: { message: 'All notifications marked as read' } });
});

// PATCH /notifications/:id/read — mark single as read
notifications.patch('/:id/read', authMiddleware, async (c) => {
  const userId = c.get('userId');
  const notifId = c.req.param('id');

  const notif = await c.env.DB.prepare(
    'SELECT id FROM notifications WHERE id = ? AND user_id = ?'
  ).bind(notifId, userId).first();

  if (!notif) return c.json({ success: false, error: 'Notification not found' }, 404);

  await c.env.DB.prepare(
    'UPDATE notifications SET is_read = 1 WHERE id = ?'
  ).bind(notifId).run();

  return c.json({ success: true, data: { message: 'Notification marked as read' } });
});

export default notifications;
