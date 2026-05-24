import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth';

type Env = {
  DB: D1Database;
  IMAGES: R2Bucket;
  JWT_SECRET: string;
  FRONTEND_URL: string;
  R2_PUBLIC_URL: string;
};

type Variables = {
  userId: string | undefined;
  user: { sub: string; username: string; is_admin: number; iat: number; exp: number } | undefined;
};

const mod = new Hono<{ Bindings: Env; Variables: Variables }>();

async function isModOrAdmin(
  db: D1Database,
  userId: string,
  communityId: string,
  isAdmin: boolean
): Promise<boolean> {
  if (isAdmin) return true;
  const membership = await db.prepare(
    "SELECT role FROM community_members WHERE user_id = ? AND community_id = ? AND role IN ('moderator', 'admin')"
  ).bind(userId, communityId).first<{ role: string }>();
  return !!membership;
}

// GET /mod/:communitySlug/queue — reported posts/comments in community
mod.get('/:communitySlug/queue', authMiddleware, async (c) => {
  const userId = c.get('userId');
  const user = c.get('user');
  const slug = c.req.param('communitySlug');

  const community = await c.env.DB.prepare('SELECT id FROM communities WHERE slug = ?').bind(slug).first<{ id: string }>();
  if (!community) return c.json({ success: false, error: 'Community not found' }, 404);

  const canMod = await isModOrAdmin(c.env.DB, userId, community.id, user?.is_admin === 1);
  if (!canMod) return c.json({ success: false, error: 'Moderator access required' }, 403);

  // Get reports for posts in this community
  const postReports = await c.env.DB.prepare(`
    SELECT r.*, p.title as target_title, p.author_id as target_author_id,
      ua.username as reporter_username
    FROM reports r
    JOIN posts p ON r.target_id = p.id
    LEFT JOIN users ua ON r.reporter_id = ua.id
    WHERE r.target_type = 'post' AND p.community_id = ? AND r.resolved = 0
    ORDER BY r.created_at DESC
  `).bind(community.id).all<{
    id: string; reporter_id: string; target_id: string; target_type: string;
    reason: string; resolved: number; created_at: number;
    target_title: string; target_author_id: string; reporter_username: string;
  }>();

  // Get reports for comments in this community's posts
  const commentReports = await c.env.DB.prepare(`
    SELECT r.*, cm.body as target_body, cm.author_id as target_author_id,
      ua.username as reporter_username
    FROM reports r
    JOIN comments cm ON r.target_id = cm.id
    JOIN posts p ON cm.post_id = p.id
    LEFT JOIN users ua ON r.reporter_id = ua.id
    WHERE r.target_type = 'comment' AND p.community_id = ? AND r.resolved = 0
    ORDER BY r.created_at DESC
  `).bind(community.id).all<{
    id: string; reporter_id: string; target_id: string; target_type: string;
    reason: string; resolved: number; created_at: number;
    target_body: string; target_author_id: string; reporter_username: string;
  }>();

  return c.json({
    success: true,
    data: {
      post_reports: postReports.results ?? [],
      comment_reports: commentReports.results ?? [],
    },
  });
});

// POST /mod/posts/:id/remove — remove post
mod.post('/posts/:id/remove', authMiddleware, async (c) => {
  const userId = c.get('userId');
  const user = c.get('user');
  const postId = c.req.param('id');

  const post = await c.env.DB.prepare('SELECT id, community_id FROM posts WHERE id = ?').bind(postId).first<{ id: string; community_id: string }>();
  if (!post) return c.json({ success: false, error: 'Post not found' }, 404);

  const canMod = await isModOrAdmin(c.env.DB, userId, post.community_id, user?.is_admin === 1);
  if (!canMod) return c.json({ success: false, error: 'Moderator access required' }, 403);

  const now = Math.floor(Date.now() / 1000);
  await c.env.DB.prepare('UPDATE posts SET is_removed = 1, updated_at = ? WHERE id = ?').bind(now, postId).run();

  return c.json({ success: true, data: { message: 'Post removed' } });
});

// POST /mod/posts/:id/pin — toggle pin
mod.post('/posts/:id/pin', authMiddleware, async (c) => {
  const userId = c.get('userId');
  const user = c.get('user');
  const postId = c.req.param('id');

  const post = await c.env.DB.prepare(
    'SELECT id, community_id, is_pinned FROM posts WHERE id = ?'
  ).bind(postId).first<{ id: string; community_id: string; is_pinned: number }>();

  if (!post) return c.json({ success: false, error: 'Post not found' }, 404);

  const canMod = await isModOrAdmin(c.env.DB, userId, post.community_id, user?.is_admin === 1);
  if (!canMod) return c.json({ success: false, error: 'Moderator access required' }, 403);

  const now = Math.floor(Date.now() / 1000);
  const newPin = post.is_pinned === 1 ? 0 : 1;

  await c.env.DB.prepare('UPDATE posts SET is_pinned = ?, updated_at = ? WHERE id = ?').bind(newPin, now, postId).run();

  return c.json({ success: true, data: { is_pinned: newPin } });
});

// POST /mod/users/:id/ban — ban user from community
mod.post('/users/:id/ban', authMiddleware, async (c) => {
  const userId = c.get('userId');
  const user = c.get('user');
  const targetUserId = c.req.param('id');

  const body = await c.req.json<{ community_slug?: string }>();
  if (!body.community_slug) {
    return c.json({ success: false, error: 'community_slug is required' }, 400);
  }

  const community = await c.env.DB.prepare('SELECT id FROM communities WHERE slug = ?').bind(body.community_slug).first<{ id: string }>();
  if (!community) return c.json({ success: false, error: 'Community not found' }, 404);

  const canMod = await isModOrAdmin(c.env.DB, userId, community.id, user?.is_admin === 1);
  if (!canMod) return c.json({ success: false, error: 'Moderator access required' }, 403);

  // Remove from community_members and mark as banned
  await c.env.DB.prepare(
    'DELETE FROM community_members WHERE user_id = ? AND community_id = ?'
  ).bind(targetUserId, community.id).run();

  await c.env.DB.prepare(
    "INSERT OR REPLACE INTO community_members (user_id, community_id, role, joined_at) VALUES (?, ?, 'banned', ?)"
  ).bind(targetUserId, community.id, Math.floor(Date.now() / 1000)).run();

  await c.env.DB.prepare(
    'UPDATE communities SET member_count = MAX(0, member_count - 1) WHERE id = ?'
  ).bind(community.id).run();

  return c.json({ success: true, data: { message: 'User banned from community' } });
});

// GET /admin/reports — all unresolved reports (admin only)
mod.get('/admin/reports', authMiddleware, async (c) => {
  const user = c.get('user');
  if (!user || user.is_admin !== 1) {
    return c.json({ success: false, error: 'Admin access required' }, 403);
  }

  const cursor = c.req.query('cursor');
  const limit = Math.min(parseInt(c.req.query('limit') ?? '50'), 100);

  let query = `
    SELECT r.*,
      ua.username as reporter_username,
      CASE
        WHEN r.target_type = 'post' THEN p.author_id
        WHEN r.target_type = 'comment' THEN cm.author_id
      END as target_author_id,
      CASE
        WHEN r.target_type = 'post' THEN p.title
        WHEN r.target_type = 'comment' THEN SUBSTR(cm.body, 1, 120)
      END as target_preview
    FROM reports r
    LEFT JOIN users ua ON r.reporter_id = ua.id
    LEFT JOIN posts p ON r.target_type = 'post' AND r.target_id = p.id
    LEFT JOIN comments cm ON r.target_type = 'comment' AND r.target_id = cm.id
    WHERE r.resolved = 0
  `;
  const params: (string | number)[] = [];

  if (cursor) {
    query += ' AND r.created_at < ?';
    params.push(parseInt(cursor));
  }

  query += ' ORDER BY r.created_at DESC LIMIT ?';
  params.push(limit + 1);

  const result = await c.env.DB.prepare(query).bind(...params).all<{
    id: string; reporter_id: string; target_id: string; target_type: string;
    reason: string; resolved: number; created_at: number; reporter_username: string;
    target_author_id: string | null; target_preview: string | null;
  }>();

  const rows = result.results ?? [];
  const hasMore = rows.length > limit;
  if (hasMore) rows.pop();

  const nextCursor = hasMore && rows.length > 0 ? String(rows[rows.length - 1].created_at) : null;

  return c.json({ success: true, data: { data: rows, cursor: nextCursor, hasMore } });
});

// POST /admin/reports/:id/resolve — resolve/dismiss a report (admin only)
mod.post('/admin/reports/:id/resolve', authMiddleware, async (c) => {
  const user = c.get('user');
  if (!user || user.is_admin !== 1) {
    return c.json({ success: false, error: 'Admin access required' }, 403);
  }

  const reportId = c.req.param('id');
  const now = Math.floor(Date.now() / 1000);

  const result = await c.env.DB.prepare(
    'UPDATE reports SET resolved = 1 WHERE id = ? AND resolved = 0'
  ).bind(reportId).run();

  if (!result.meta.changes) {
    return c.json({ success: false, error: 'Report not found or already resolved' }, 404);
  }

  return c.json({ success: true, data: { message: 'Report resolved' } });
});

// POST /admin/users/:id/ban — global user ban (admin only)
mod.post('/admin/users/:id/ban', authMiddleware, async (c) => {
  const user = c.get('user');
  if (!user || user.is_admin !== 1) {
    return c.json({ success: false, error: 'Admin access required' }, 403);
  }

  const targetUserId = c.req.param('id');

  // Prevent admins from banning themselves
  if (targetUserId === user.sub) {
    return c.json({ success: false, error: 'Cannot ban yourself' }, 400);
  }

  const target = await c.env.DB.prepare(
    'SELECT id, is_admin FROM users WHERE id = ?'
  ).bind(targetUserId).first<{ id: string; is_admin: number }>();

  if (!target) return c.json({ success: false, error: 'User not found' }, 404);
  if (target.is_admin === 1) {
    return c.json({ success: false, error: 'Cannot ban another admin' }, 400);
  }

  const now = Math.floor(Date.now() / 1000);
  await c.env.DB.prepare(
    'UPDATE users SET is_banned = 1, updated_at = ? WHERE id = ?'
  ).bind(now, targetUserId).run();

  return c.json({ success: true, data: { message: 'User banned globally' } });
});

export default mod;
