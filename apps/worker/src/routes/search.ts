import { Hono } from 'hono';
import { optionalAuthMiddleware } from '../middleware/auth';

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

const search = new Hono<{ Bindings: Env; Variables: Variables }>();

// GET /search?q=&community=&sort=relevance|recent&cursor=
search.get('/', optionalAuthMiddleware, async (c) => {
  const q = c.req.query('q')?.trim() ?? '';
  const community = c.req.query('community');
  const sort = c.req.query('sort') ?? 'relevance';
  const cursor = c.req.query('cursor');
  const limit = Math.min(parseInt(c.req.query('limit') ?? '20'), 50);
  const userId = c.get('userId');

  if (!q) {
    return c.json({ success: true, data: { data: [], cursor: null, hasMore: false } });
  }

  // Sanitize query for FTS5
  const ftsQuery = q.replace(/['"*]/g, ' ').trim() + '*';

  let communityId: string | null = null;
  if (community) {
    const comm = await c.env.DB.prepare('SELECT id FROM communities WHERE slug = ?').bind(community).first<{ id: string }>();
    communityId = comm?.id ?? null;
  }

  let query: string;
  let params: (string | number)[];

  if (sort === 'recent') {
    query = `
      SELECT p.*, pf.rank,
        u.username as author_username, u.avatar_url as author_avatar,
        c.slug as community_slug, c.name as community_name
      FROM posts_fts pf
      JOIN posts p ON p.rowid = pf.rowid
      LEFT JOIN users u ON p.author_id = u.id
      LEFT JOIN communities c ON p.community_id = c.id
      WHERE posts_fts MATCH ? AND p.is_removed = 0
    `;
    params = [ftsQuery];

    if (communityId) {
      query += ' AND p.community_id = ?';
      params.push(communityId);
    }

    if (cursor) {
      query += ' AND p.created_at < ?';
      params.push(parseInt(cursor));
    }

    query += ' ORDER BY p.created_at DESC LIMIT ?';
  } else {
    // relevance sort
    query = `
      SELECT p.*, pf.rank,
        u.username as author_username, u.avatar_url as author_avatar,
        c.slug as community_slug, c.name as community_name
      FROM posts_fts pf
      JOIN posts p ON p.rowid = pf.rowid
      LEFT JOIN users u ON p.author_id = u.id
      LEFT JOIN communities c ON p.community_id = c.id
      WHERE posts_fts MATCH ? AND p.is_removed = 0
    `;
    params = [ftsQuery];

    if (communityId) {
      query += ' AND p.community_id = ?';
      params.push(communityId);
    }

    if (cursor) {
      query += ' AND pf.rank > ?';
      params.push(parseFloat(cursor));
    }

    query += ' ORDER BY pf.rank LIMIT ?';
  }

  params.push(limit + 1);

  const result = await c.env.DB.prepare(query).bind(...params).all<{
    id: string; title: string; body: string | null; post_type: string;
    author_id: string; community_id: string; location_tag: string | null;
    upvotes: number; downvotes: number; score: number; comment_count: number;
    hot_score: number; is_removed: number; is_pinned: number;
    created_at: number; updated_at: number; rank: number;
    author_username: string; author_avatar: string | null;
    community_slug: string; community_name: string;
  }>();

  const rows = result.results ?? [];
  const hasMore = rows.length > limit;
  if (hasMore) rows.pop();

  // Fetch tags for results
  const postIds = rows.map(r => r.id);
  let tags: Record<string, string[]> = {};

  if (postIds.length > 0) {
    const placeholders = postIds.map(() => '?').join(',');
    const tagRows = await c.env.DB.prepare(
      `SELECT post_id, tag FROM post_tags WHERE post_id IN (${placeholders})`
    ).bind(...postIds).all<{ post_id: string; tag: string }>();

    for (const t of tagRows.results ?? []) {
      if (!tags[t.post_id]) tags[t.post_id] = [];
      tags[t.post_id].push(t.tag);
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
    tags: tags[row.id] ?? [],
    user_vote: (userVotes[row.id] as 1 | -1 | undefined) ?? null,
  }));

  let nextCursor: string | null = null;
  if (hasMore && rows.length > 0) {
    const last = rows[rows.length - 1];
    nextCursor = sort === 'recent' ? String(last.created_at) : String(last.rank);
  }

  return c.json({ success: true, data: { data, cursor: nextCursor, hasMore } });
});

export default search;
