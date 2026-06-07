import { Hono } from 'hono';
import { generateId } from '../utils/id';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth';

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

const communities = new Hono<{ Bindings: Env; Variables: Variables }>();

// GET /communities — list all communities
communities.get('/', optionalAuthMiddleware, async (c) => {
  const result = await c.env.DB.prepare(
    'SELECT * FROM communities ORDER BY member_count DESC'
  ).all<{
    id: string; slug: string; name: string; description: string | null;
    banner_url: string | null; icon_url: string | null;
    member_count: number; post_count: number;
    created_by: string | null; created_at: number;
  }>();

  const userId = c.get('userId');
  let memberSet = new Set<string>();

  if (userId && result.results && result.results.length > 0) {
    const ids = result.results.map(c => c.id);
    const placeholders = ids.map(() => '?').join(',');
    const memberships = await c.env.DB.prepare(
      `SELECT community_id FROM community_members WHERE user_id = ? AND community_id IN (${placeholders})`
    ).bind(userId, ...ids).all<{ community_id: string }>();
    memberSet = new Set((memberships.results ?? []).map(m => m.community_id));
  }

  const data = (result.results ?? []).map(c => ({ ...c, is_member: memberSet.has(c.id) }));
  return c.json({ success: true, data });
});

// GET /communities/:slug — single community
communities.get('/:slug', optionalAuthMiddleware, async (c) => {
  const slug = c.req.param('slug');
  const userId = c.get('userId');

  const community = await c.env.DB.prepare(
    'SELECT * FROM communities WHERE slug = ?'
  ).bind(slug).first<{
    id: string; slug: string; name: string; description: string | null;
    banner_url: string | null; icon_url: string | null;
    member_count: number; post_count: number;
    created_by: string | null; created_at: number;
  }>();

  if (!community) return c.json({ success: false, error: 'Community not found' }, 404);

  let isMember = false;
  if (userId) {
    const membership = await c.env.DB.prepare(
      'SELECT user_id FROM community_members WHERE user_id = ? AND community_id = ?'
    ).bind(userId, community.id).first();
    isMember = !!membership;
  }

  return c.json({ success: true, data: { ...community, is_member: isMember } });
});

// POST /communities — create community (any authenticated user)
communities.post('/', authMiddleware, async (c) => {
  const userId = c.get('userId');

  const body = await c.req.json<{ slug?: string; name?: string; description?: string }>();
  if (!body.slug || !body.name) {
    return c.json({ success: false, error: 'slug and name are required' }, 400);
  }

  if (!/^[a-z0-9-]{2,50}$/.test(body.slug)) {
    return c.json({ success: false, error: 'slug must be 2-50 lowercase letters, numbers, or hyphens' }, 400);
  }

  const existing = await c.env.DB.prepare('SELECT id FROM communities WHERE slug = ?').bind(body.slug).first();
  if (existing) return c.json({ success: false, error: 'Community slug already taken' }, 409);

  const id = generateId('com');
  const now = Math.floor(Date.now() / 1000);

  await c.env.DB.prepare(
    'INSERT INTO communities (id, slug, name, description, member_count, post_count, created_by, created_at) VALUES (?, ?, ?, ?, 1, 0, ?, ?)'
  ).bind(id, body.slug, body.name, body.description ?? null, userId, now).run();

  // Auto-join creator as community admin
  await c.env.DB.prepare(
    "INSERT INTO community_members (user_id, community_id, role, joined_at) VALUES (?, ?, 'admin', ?)"
  ).bind(userId, id, now).run();

  const created = await c.env.DB.prepare('SELECT * FROM communities WHERE id = ?').bind(id).first();
  return c.json({ success: true, data: created }, 201);
});

// GET /communities/:slug/posts — paginated posts
communities.get('/:slug/posts', optionalAuthMiddleware, async (c) => {
  const slug = c.req.param('slug');
  const sort = c.req.query('sort') ?? 'hot';
  const time = c.req.query('time') ?? 'all';
  const cursor = c.req.query('cursor');
  const limit = Math.min(parseInt(c.req.query('limit') ?? '20'), 50);
  const userId = c.get('userId');

  const community = await c.env.DB.prepare('SELECT id FROM communities WHERE slug = ?').bind(slug).first<{ id: string }>();
  if (!community) return c.json({ success: false, error: 'Community not found' }, 404);

  const now = Math.floor(Date.now() / 1000);
  let timeFilter = 0;
  switch (time) {
    case 'today': timeFilter = now - 86400; break;
    case 'week': timeFilter = now - 604800; break;
    case 'month': timeFilter = now - 2592000; break;
  }

  let orderBy: string;
  switch (sort) {
    case 'new': orderBy = 'p.created_at DESC'; break;
    case 'top': orderBy = 'p.score DESC, p.created_at DESC'; break;
    default: orderBy = 'p.hot_score DESC, p.created_at DESC';
  }

  let query = `
    SELECT p.*,
      u.username as author_username, u.avatar_url as author_avatar
    FROM posts p
    LEFT JOIN users u ON p.author_id = u.id
    WHERE p.community_id = ? AND p.is_removed = 0
  `;
  const params: (string | number)[] = [community.id];

  if (timeFilter > 0) {
    query += ' AND p.created_at >= ?';
    params.push(timeFilter);
  }

  if (cursor) {
    if (sort === 'new') {
      query += ' AND p.created_at < ?';
      params.push(parseInt(cursor));
    } else if (sort === 'top') {
      query += ' AND p.score < ?';
      params.push(parseInt(cursor));
    } else {
      query += ' AND p.hot_score < ?';
      params.push(parseFloat(cursor));
    }
  }

  query += ` ORDER BY ${orderBy} LIMIT ?`;
  params.push(limit + 1);

  const result = await c.env.DB.prepare(query).bind(...params).all<{
    id: string; title: string; body: string | null; post_type: string;
    author_id: string; community_id: string; location_tag: string | null;
    upvotes: number; downvotes: number; score: number; comment_count: number;
    hot_score: number; is_removed: number; is_pinned: number;
    created_at: number; updated_at: number;
    author_username: string; author_avatar: string | null;
  }>();

  const rows = result.results ?? [];
  const hasMore = rows.length > limit;
  if (hasMore) rows.pop();

  const postIds = rows.map(r => r.id);
  let tags: Record<string, string[]> = {};
  let images: Record<string, { id: string; url: string; position: number }[]> = {};

  if (postIds.length > 0) {
    const placeholders = postIds.map(() => '?').join(',');
    const tagRows = await c.env.DB.prepare(
      `SELECT post_id, tag FROM post_tags WHERE post_id IN (${placeholders})`
    ).bind(...postIds).all<{ post_id: string; tag: string }>();

    for (const t of tagRows.results ?? []) {
      if (!tags[t.post_id]) tags[t.post_id] = [];
      tags[t.post_id].push(t.tag);
    }

    const imgRows = await c.env.DB.prepare(
      `SELECT id, post_id, url, position FROM post_images WHERE post_id IN (${placeholders}) ORDER BY position`
    ).bind(...postIds).all<{ id: string; post_id: string; url: string; position: number }>();

    for (const img of imgRows.results ?? []) {
      if (!images[img.post_id]) images[img.post_id] = [];
      images[img.post_id].push({ id: img.id, url: img.url, position: img.position });
    }
  }

  let userVotes: Record<string, number> = {};
  if (userId && postIds.length > 0) {
    const placeholders = postIds.map(() => '?').join(',');
    const voteRows = await c.env.DB.prepare(
      `SELECT target_id, value FROM votes WHERE user_id = ? AND target_type = 'post' AND target_id IN (${placeholders})`
    ).bind(userId, ...postIds).all<{ target_id: string; value: number }>();

    for (const v of voteRows.results ?? []) {
      userVotes[v.target_id] = v.value;
    }
  }

  const communityInfo = await c.env.DB.prepare('SELECT id, slug, name FROM communities WHERE id = ?').bind(community.id).first<{ id: string; slug: string; name: string }>();

  const data = rows.map(row => ({
    id: row.id,
    title: row.title,
    body: row.body,
    post_type: row.post_type,
    author_id: row.author_id,
    community_id: row.community_id,
    location_tag: row.location_tag,
    upvotes: row.upvotes,
    downvotes: row.downvotes,
    score: row.score,
    comment_count: row.comment_count,
    hot_score: row.hot_score,
    is_removed: row.is_removed,
    is_pinned: row.is_pinned,
    created_at: row.created_at,
    updated_at: row.updated_at,
    author: { id: row.author_id, username: row.author_username, avatar_url: row.author_avatar },
    community: communityInfo ?? { id: row.community_id, slug: '', name: '' },
    images: images[row.id] ?? [],
    tags: tags[row.id] ?? [],
    user_vote: (userVotes[row.id] as 1 | -1 | undefined) ?? null,
  }));

  let nextCursor: string | null = null;
  if (hasMore && rows.length > 0) {
    const last = rows[rows.length - 1];
    if (sort === 'new') nextCursor = String(last.created_at);
    else if (sort === 'top') nextCursor = String(last.score);
    else nextCursor = String(last.hot_score);
  }

  return c.json({ success: true, data: { data, cursor: nextCursor, hasMore } });
});

// POST /communities/:slug/join
communities.post('/:slug/join', authMiddleware, async (c) => {
  const userId = c.get('userId');
  const slug = c.req.param('slug');

  const community = await c.env.DB.prepare('SELECT id FROM communities WHERE slug = ?').bind(slug).first<{ id: string }>();
  if (!community) return c.json({ success: false, error: 'Community not found' }, 404);

  const existing = await c.env.DB.prepare(
    'SELECT user_id FROM community_members WHERE user_id = ? AND community_id = ?'
  ).bind(userId, community.id).first();

  if (existing) return c.json({ success: true, data: { message: 'Already a member' } });

  const now = Math.floor(Date.now() / 1000);
  await c.env.DB.prepare(
    "INSERT INTO community_members (user_id, community_id, role, joined_at) VALUES (?, ?, 'member', ?)"
  ).bind(userId, community.id, now).run();

  await c.env.DB.prepare(
    'UPDATE communities SET member_count = member_count + 1 WHERE id = ?'
  ).bind(community.id).run();

  return c.json({ success: true, data: { message: 'Joined community' } });
});

// DELETE /communities/:slug/join
communities.delete('/:slug/join', authMiddleware, async (c) => {
  const userId = c.get('userId');
  const slug = c.req.param('slug');

  const community = await c.env.DB.prepare('SELECT id FROM communities WHERE slug = ?').bind(slug).first<{ id: string }>();
  if (!community) return c.json({ success: false, error: 'Community not found' }, 404);

  const existing = await c.env.DB.prepare(
    'SELECT user_id FROM community_members WHERE user_id = ? AND community_id = ?'
  ).bind(userId, community.id).first();

  if (!existing) return c.json({ success: true, data: { message: 'Not a member' } });

  await c.env.DB.prepare(
    'DELETE FROM community_members WHERE user_id = ? AND community_id = ?'
  ).bind(userId, community.id).run();

  await c.env.DB.prepare(
    'UPDATE communities SET member_count = MAX(0, member_count - 1) WHERE id = ?'
  ).bind(community.id).run();

  return c.json({ success: true, data: { message: 'Left community' } });
});

export default communities;
