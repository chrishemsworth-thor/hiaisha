import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth';

type Env = {
  DB: D1Database;
  IMAGES: R2Bucket;
  JWT_SECRET: string;
  FRONTEND_URL: string;
};

type Variables = {
  userId: string;
  user: { sub: string; username: string; is_admin: number; iat: number; exp: number };
};

const users = new Hono<{ Bindings: Env; Variables: Variables }>();

// GET /users/:username — public profile
users.get('/:username', async (c) => {
  const username = c.req.param('username').toLowerCase();

  const user = await c.env.DB.prepare(
    'SELECT id, username, avatar_url, bio, karma, created_at FROM users WHERE username = ?'
  ).bind(username).first<{
    id: string; username: string; avatar_url: string | null;
    bio: string | null; karma: number; created_at: number;
  }>();

  if (!user) return c.json({ success: false, error: 'User not found' }, 404);

  const postCount = await c.env.DB.prepare(
    'SELECT COUNT(*) as count FROM posts WHERE author_id = ? AND is_removed = 0'
  ).bind(user.id).first<{ count: number }>();

  const commentCount = await c.env.DB.prepare(
    'SELECT COUNT(*) as count FROM comments WHERE author_id = ? AND is_deleted = 0'
  ).bind(user.id).first<{ count: number }>();

  return c.json({
    success: true,
    data: {
      ...user,
      post_count: postCount?.count ?? 0,
      comment_count: commentCount?.count ?? 0,
    },
  });
});

// GET /users/:username/posts
users.get('/:username/posts', async (c) => {
  const username = c.req.param('username').toLowerCase();
  const cursor = c.req.query('cursor');
  const limit = Math.min(parseInt(c.req.query('limit') ?? '20'), 50);

  const user = await c.env.DB.prepare('SELECT id FROM users WHERE username = ?').bind(username).first<{ id: string }>();
  if (!user) return c.json({ success: false, error: 'User not found' }, 404);

  let query = `
    SELECT p.*,
      u.username as author_username, u.avatar_url as author_avatar,
      c.slug as community_slug, c.name as community_name
    FROM posts p
    LEFT JOIN users u ON p.author_id = u.id
    LEFT JOIN communities c ON p.community_id = c.id
    WHERE p.author_id = ? AND p.is_removed = 0
  `;
  const params: (string | number)[] = [user.id];

  if (cursor) {
    query += ' AND p.created_at < ?';
    params.push(parseInt(cursor));
  }

  query += ' ORDER BY p.created_at DESC LIMIT ?';
  params.push(limit + 1);

  const result = await c.env.DB.prepare(query).bind(...params).all<{
    id: string; title: string; body: string | null; post_type: string;
    author_id: string; community_id: string; location_tag: string | null;
    upvotes: number; downvotes: number; score: number; comment_count: number;
    hot_score: number; is_removed: number; is_pinned: number;
    created_at: number; updated_at: number;
    author_username: string; author_avatar: string | null;
    community_slug: string; community_name: string;
  }>();

  const rows = result.results ?? [];
  const hasMore = rows.length > limit;
  if (hasMore) rows.pop();

  const data = rows.map(row => ({
    ...row,
    author: { id: row.author_id, username: row.author_username, avatar_url: row.author_avatar },
    community: { id: row.community_id, slug: row.community_slug, name: row.community_name },
  }));

  const nextCursor = hasMore && rows.length > 0 ? String(rows[rows.length - 1].created_at) : null;

  return c.json({ success: true, data: { data, cursor: nextCursor, hasMore } });
});

// GET /users/:username/comments
users.get('/:username/comments', async (c) => {
  const username = c.req.param('username').toLowerCase();
  const cursor = c.req.query('cursor');
  const limit = Math.min(parseInt(c.req.query('limit') ?? '20'), 50);

  const user = await c.env.DB.prepare('SELECT id FROM users WHERE username = ?').bind(username).first<{ id: string }>();
  if (!user) return c.json({ success: false, error: 'User not found' }, 404);

  let query = `
    SELECT c.*, u.username as author_username, u.avatar_url as author_avatar,
      p.title as post_title, p.id as post_id
    FROM comments c
    LEFT JOIN users u ON c.author_id = u.id
    LEFT JOIN posts p ON c.post_id = p.id
    WHERE c.author_id = ? AND c.is_deleted = 0
  `;
  const params: (string | number)[] = [user.id];

  if (cursor) {
    query += ' AND c.created_at < ?';
    params.push(parseInt(cursor));
  }

  query += ' ORDER BY c.created_at DESC LIMIT ?';
  params.push(limit + 1);

  const result = await c.env.DB.prepare(query).bind(...params).all<{
    id: string; post_id: string; author_id: string; parent_id: string | null;
    depth: number; body: string; upvotes: number; downvotes: number; score: number;
    is_removed: number; is_deleted: number; created_at: number; updated_at: number;
    author_username: string; author_avatar: string | null;
    post_title: string; post_id_link: string;
  }>();

  const rows = result.results ?? [];
  const hasMore = rows.length > limit;
  if (hasMore) rows.pop();

  const data = rows.map(row => ({
    ...row,
    author: { id: row.author_id, username: row.author_username, avatar_url: row.author_avatar },
    post: { id: row.post_id, title: row.post_title },
  }));

  const nextCursor = hasMore && rows.length > 0 ? String(rows[rows.length - 1].created_at) : null;

  return c.json({ success: true, data: { data, cursor: nextCursor, hasMore } });
});

// PATCH /users/me — update bio
users.patch('/me', authMiddleware, async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json<{ bio?: string }>();

  if (body.bio !== undefined && body.bio.length > 500) {
    return c.json({ success: false, error: 'Bio must be 500 characters or fewer' }, 400);
  }

  const now = Math.floor(Date.now() / 1000);
  await c.env.DB.prepare(
    'UPDATE users SET bio = ?, updated_at = ? WHERE id = ?'
  ).bind(body.bio ?? null, now, userId).run();

  const user = await c.env.DB.prepare(
    'SELECT id, username, email, email_verified, avatar_url, bio, karma, is_admin, created_at, updated_at FROM users WHERE id = ?'
  ).bind(userId).first();

  return c.json({ success: true, data: user });
});

// POST /users/me/avatar — update avatar URL
users.post('/me/avatar', authMiddleware, async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json<{ avatar_url?: string }>();

  if (!body.avatar_url) {
    return c.json({ success: false, error: 'avatar_url is required' }, 400);
  }

  const now = Math.floor(Date.now() / 1000);
  await c.env.DB.prepare(
    'UPDATE users SET avatar_url = ?, updated_at = ? WHERE id = ?'
  ).bind(body.avatar_url, now, userId).run();

  const user = await c.env.DB.prepare(
    'SELECT id, username, email, email_verified, avatar_url, bio, karma, is_admin, created_at, updated_at FROM users WHERE id = ?'
  ).bind(userId).first();

  return c.json({ success: true, data: user });
});

export default users;
