import { Hono } from 'hono';
import { generateId } from '../utils/id';
import { calculateHotScore } from '../utils/hotScore';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth';
import { postCreationRateLimit } from '../middleware/rateLimit';

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

const posts = new Hono<{ Bindings: Env; Variables: Variables }>();

function getTimeFilter(time: string): number {
  const now = Math.floor(Date.now() / 1000);
  switch (time) {
    case 'today': return now - 86400;
    case 'week': return now - 604800;
    case 'month': return now - 2592000;
    default: return 0;
  }
}

// GET /posts — homepage feed
posts.get('/', optionalAuthMiddleware, async (c) => {
  const sort = c.req.query('sort') ?? 'hot';
  const time = c.req.query('time') ?? 'all';
  const cursor = c.req.query('cursor');
  const limit = Math.min(parseInt(c.req.query('limit') ?? '20'), 50);
  const userId = c.get('userId');

  const timeFilter = getTimeFilter(time);

  let orderBy: string;
  switch (sort) {
    case 'new': orderBy = 'p.created_at DESC'; break;
    case 'top': orderBy = 'p.score DESC, p.created_at DESC'; break;
    default: orderBy = 'p.hot_score DESC, p.created_at DESC';
  }

  let query = `
    SELECT p.*,
      u.username as author_username, u.avatar_url as author_avatar,
      c.slug as community_slug, c.name as community_name
    FROM posts p
    LEFT JOIN users u ON p.author_id = u.id
    LEFT JOIN communities c ON p.community_id = c.id
    WHERE p.is_removed = 0
  `;
  const params: (string | number)[] = [];

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
    community_slug: string; community_name: string;
  }>();

  const rows = result.results ?? [];
  const hasMore = rows.length > limit;
  if (hasMore) rows.pop();

  // Fetch tags and images for posts
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

  // Fetch user votes
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
    community: { id: row.community_id, slug: row.community_slug, name: row.community_name },
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

// GET /posts/:id — single post
posts.get('/:id', optionalAuthMiddleware, async (c) => {
  const id = c.req.param('id');
  const userId = c.get('userId');

  const post = await c.env.DB.prepare(`
    SELECT p.*,
      u.id as author_id, u.username as author_username, u.avatar_url as author_avatar,
      comm.slug as community_slug, comm.name as community_name
    FROM posts p
    LEFT JOIN users u ON p.author_id = u.id
    LEFT JOIN communities comm ON p.community_id = comm.id
    WHERE p.id = ? AND p.is_removed = 0
  `).bind(id).first<{
    id: string; title: string; body: string | null; post_type: string;
    author_id: string; community_id: string; location_tag: string | null;
    upvotes: number; downvotes: number; score: number; comment_count: number;
    hot_score: number; is_removed: number; is_pinned: number;
    created_at: number; updated_at: number;
    author_username: string; author_avatar: string | null;
    community_slug: string; community_name: string;
  }>();

  if (!post) return c.json({ success: false, error: 'Post not found' }, 404);

  const [tagsResult, imagesResult] = await Promise.all([
    c.env.DB.prepare('SELECT tag FROM post_tags WHERE post_id = ?').bind(id).all<{ tag: string }>(),
    c.env.DB.prepare('SELECT id, url, position FROM post_images WHERE post_id = ? ORDER BY position').bind(id).all<{ id: string; url: string; position: number }>(),
  ]);

  let userVote: 1 | -1 | null = null;
  if (userId) {
    const vote = await c.env.DB.prepare(
      "SELECT value FROM votes WHERE user_id = ? AND target_id = ? AND target_type = 'post'"
    ).bind(userId, id).first<{ value: number }>();
    userVote = vote ? (vote.value as 1 | -1) : null;
  }

  return c.json({
    success: true,
    data: {
      ...post,
      author: { id: post.author_id, username: post.author_username, avatar_url: post.author_avatar },
      community: { id: post.community_id, slug: post.community_slug, name: post.community_name },
      tags: (tagsResult.results ?? []).map(t => t.tag),
      images: imagesResult.results ?? [],
      user_vote: userVote,
    },
  });
});

// POST /posts — create post
posts.post('/', authMiddleware, postCreationRateLimit, async (c) => {
  const userId = c.get('userId');

  const user = await c.env.DB.prepare(
    'SELECT id, email_verified FROM users WHERE id = ?'
  ).bind(userId).first<{ id: string; email_verified: number }>();

  if (!user) return c.json({ success: false, error: 'User not found' }, 404);

  const body = await c.req.json<{
    title?: string;
    body?: string;
    post_type?: string;
    community_id?: string;
    location_tag?: string;
    tags?: string[];
    image_urls?: string[];
  }>();

  if (!body.title || !body.post_type || !body.community_id) {
    return c.json({ success: false, error: 'title, post_type, and community_id are required' }, 400);
  }

  if (!['text', 'image'].includes(body.post_type)) {
    return c.json({ success: false, error: 'post_type must be text or image' }, 400);
  }

  if (body.title.length > 300) {
    return c.json({ success: false, error: 'Title must be 300 characters or fewer' }, 400);
  }

  if (body.tags && body.tags.length > 5) {
    return c.json({ success: false, error: 'Maximum 5 tags allowed' }, 400);
  }

  const community = await c.env.DB.prepare(
    'SELECT id FROM communities WHERE id = ?'
  ).bind(body.community_id).first<{ id: string }>();

  if (!community) return c.json({ success: false, error: 'Community not found' }, 404);

  const id = generateId('pst');
  const now = Math.floor(Date.now() / 1000);
  const hotScore = calculateHotScore(1, now);

  await c.env.DB.prepare(`
    INSERT INTO posts (id, title, body, post_type, author_id, community_id, location_tag,
      upvotes, downvotes, score, comment_count, hot_score, is_removed, is_pinned, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, 1, 0, 1, 0, ?, 0, 0, ?, ?)
  `).bind(
    id, body.title, body.body ?? null, body.post_type, userId,
    body.community_id, body.location_tag ?? null, hotScore, now, now
  ).run();

  // Insert tags
  if (body.tags && body.tags.length > 0) {
    for (const tag of body.tags) {
      await c.env.DB.prepare('INSERT OR IGNORE INTO post_tags (post_id, tag) VALUES (?, ?)').bind(id, tag.toLowerCase()).run();
    }
  }

  // Insert images
  if (body.image_urls && body.image_urls.length > 0) {
    for (let i = 0; i < body.image_urls.length; i++) {
      const imgId = generateId('img');
      await c.env.DB.prepare(
        'INSERT INTO post_images (id, post_id, url, position, created_at) VALUES (?, ?, ?, ?, ?)'
      ).bind(imgId, id, body.image_urls[i], i, now).run();
    }
  }

  // Increment community post_count
  await c.env.DB.prepare(
    'UPDATE communities SET post_count = post_count + 1 WHERE id = ?'
  ).bind(body.community_id).run();

  // Auto-vote by creator
  await c.env.DB.prepare(
    "INSERT OR IGNORE INTO votes (user_id, target_id, target_type, value, created_at) VALUES (?, ?, 'post', 1, ?)"
  ).bind(userId, id, now).run();

  const created = await c.env.DB.prepare('SELECT * FROM posts WHERE id = ?').bind(id).first();
  return c.json({ success: true, data: created }, 201);
});

// PATCH /posts/:id — edit post (author only, text posts)
posts.patch('/:id', authMiddleware, async (c) => {
  const userId = c.get('userId');
  const postId = c.req.param('id');

  const post = await c.env.DB.prepare(
    'SELECT id, author_id, post_type FROM posts WHERE id = ?'
  ).bind(postId).first<{ id: string; author_id: string; post_type: string }>();

  if (!post) return c.json({ success: false, error: 'Post not found' }, 404);
  if (post.author_id !== userId) return c.json({ success: false, error: 'Forbidden' }, 403);
  if (post.post_type !== 'text') return c.json({ success: false, error: 'Only text posts can be edited' }, 400);

  const body = await c.req.json<{ body?: string; location_tag?: string; tags?: string[] }>();
  const now = Math.floor(Date.now() / 1000);

  await c.env.DB.prepare(
    'UPDATE posts SET body = ?, location_tag = ?, updated_at = ? WHERE id = ?'
  ).bind(body.body ?? null, body.location_tag ?? null, now, postId).run();

  if (body.tags !== undefined) {
    await c.env.DB.prepare('DELETE FROM post_tags WHERE post_id = ?').bind(postId).run();
    for (const tag of body.tags.slice(0, 5)) {
      await c.env.DB.prepare('INSERT OR IGNORE INTO post_tags (post_id, tag) VALUES (?, ?)').bind(postId, tag.toLowerCase()).run();
    }
  }

  const updated = await c.env.DB.prepare('SELECT * FROM posts WHERE id = ?').bind(postId).first();
  return c.json({ success: true, data: updated });
});

// DELETE /posts/:id — soft delete
posts.delete('/:id', authMiddleware, async (c) => {
  const userId = c.get('userId');
  const user = c.get('user');
  const postId = c.req.param('id');

  const post = await c.env.DB.prepare(
    'SELECT id, author_id, community_id FROM posts WHERE id = ?'
  ).bind(postId).first<{ id: string; author_id: string; community_id: string }>();

  if (!post) return c.json({ success: false, error: 'Post not found' }, 404);

  const isAuthor = post.author_id === userId;
  const isAdmin = user?.is_admin === 1;

  if (!isAuthor && !isAdmin) {
    // Check if mod
    const membership = await c.env.DB.prepare(
      "SELECT role FROM community_members WHERE user_id = ? AND community_id = ? AND role IN ('moderator', 'admin')"
    ).bind(userId, post.community_id).first<{ role: string }>();
    if (!membership) return c.json({ success: false, error: 'Forbidden' }, 403);
  }

  const now = Math.floor(Date.now() / 1000);
  await c.env.DB.prepare('UPDATE posts SET is_removed = 1, updated_at = ? WHERE id = ?').bind(now, postId).run();
  await c.env.DB.prepare('UPDATE communities SET post_count = MAX(0, post_count - 1) WHERE id = ?').bind(post.community_id).run();

  return c.json({ success: true, data: { message: 'Post deleted' } });
});

// POST /posts/:id/vote
posts.post('/:id/vote', authMiddleware, async (c) => {
  const userId = c.get('userId');
  const postId = c.req.param('id');

  const body = await c.req.json<{ value: 1 | -1 | 0 }>();
  if (![1, -1, 0].includes(body.value)) {
    return c.json({ success: false, error: 'value must be 1, -1, or 0' }, 400);
  }

  const post = await c.env.DB.prepare(
    'SELECT id, author_id, upvotes, downvotes, score, hot_score, created_at FROM posts WHERE id = ? AND is_removed = 0'
  ).bind(postId).first<{ id: string; author_id: string; upvotes: number; downvotes: number; score: number; hot_score: number; created_at: number }>();

  if (!post) return c.json({ success: false, error: 'Post not found' }, 404);

  const existing = await c.env.DB.prepare(
    "SELECT value FROM votes WHERE user_id = ? AND target_id = ? AND target_type = 'post'"
  ).bind(userId, postId).first<{ value: number }>();

  const now = Math.floor(Date.now() / 1000);
  const oldValue = existing?.value ?? 0;
  const newValue = body.value;

  if (oldValue === newValue) {
    return c.json({ success: true, data: { message: 'Vote unchanged' } });
  }

  if (newValue === 0) {
    await c.env.DB.prepare(
      "DELETE FROM votes WHERE user_id = ? AND target_id = ? AND target_type = 'post'"
    ).bind(userId, postId).run();
  } else if (oldValue === 0) {
    await c.env.DB.prepare(
      "INSERT INTO votes (user_id, target_id, target_type, value, created_at) VALUES (?, ?, 'post', ?, ?)"
    ).bind(userId, postId, newValue, now).run();
  } else {
    await c.env.DB.prepare(
      "UPDATE votes SET value = ? WHERE user_id = ? AND target_id = ? AND target_type = 'post'"
    ).bind(newValue, userId, postId).run();
  }

  // Recalculate upvotes, downvotes, score
  const upvoteDelta = (newValue === 1 ? 1 : 0) - (oldValue === 1 ? 1 : 0);
  const downvoteDelta = (newValue === -1 ? 1 : 0) - (oldValue === -1 ? 1 : 0);
  const newUpvotes = Math.max(0, post.upvotes + upvoteDelta);
  const newDownvotes = Math.max(0, post.downvotes + downvoteDelta);
  const newScore = newUpvotes - newDownvotes;
  const newHotScore = calculateHotScore(newScore, post.created_at);

  await c.env.DB.prepare(
    'UPDATE posts SET upvotes = ?, downvotes = ?, score = ?, hot_score = ?, updated_at = ? WHERE id = ?'
  ).bind(newUpvotes, newDownvotes, newScore, newHotScore, now, postId).run();

  // Update author karma
  if (post.author_id !== userId) {
    const karmaDelta = newValue - oldValue;
    await c.env.DB.prepare('UPDATE users SET karma = karma + ? WHERE id = ?').bind(karmaDelta, post.author_id).run();
  }

  return c.json({ success: true, data: { upvotes: newUpvotes, downvotes: newDownvotes, score: newScore, user_vote: newValue || null } });
});

// POST /posts/:id/report
posts.post('/:id/report', authMiddleware, async (c) => {
  const userId = c.get('userId');
  const postId = c.req.param('id');

  const body = await c.req.json<{ reason?: string }>();
  const validReasons = ['spam', 'misinformation', 'off-topic', 'offensive'];
  if (!body.reason || !validReasons.includes(body.reason)) {
    return c.json({ success: false, error: 'reason must be one of: ' + validReasons.join(', ') }, 400);
  }

  const post = await c.env.DB.prepare('SELECT id FROM posts WHERE id = ?').bind(postId).first();
  if (!post) return c.json({ success: false, error: 'Post not found' }, 404);

  const id = generateId('rpt');
  const now = Math.floor(Date.now() / 1000);

  await c.env.DB.prepare(
    "INSERT INTO reports (id, reporter_id, target_id, target_type, reason, resolved, created_at) VALUES (?, ?, ?, 'post', ?, 0, ?)"
  ).bind(id, userId, postId, body.reason, now).run();

  return c.json({ success: true, data: { message: 'Report submitted' } }, 201);
});

export default posts;
