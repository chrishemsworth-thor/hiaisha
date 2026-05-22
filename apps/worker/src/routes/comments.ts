import { Hono } from 'hono';
import { generateId } from '../utils/id';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth';
import { commentRateLimit } from '../middleware/rateLimit';

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

const comments = new Hono<{ Bindings: Env; Variables: Variables }>();

interface CommentRow {
  id: string;
  post_id: string;
  author_id: string;
  parent_id: string | null;
  depth: number;
  body: string;
  upvotes: number;
  downvotes: number;
  score: number;
  is_removed: number;
  is_deleted: number;
  created_at: number;
  updated_at: number;
  author_username: string;
  author_avatar: string | null;
}

interface CommentNode extends CommentRow {
  author: { id: string; username: string; avatar_url: string | null };
  replies: CommentNode[];
  user_vote: 1 | -1 | null;
}

// GET /posts/:id/comments — threaded comments
comments.get('/posts/:id/comments', optionalAuthMiddleware, async (c) => {
  const postId = c.req.param('id');
  const userId = c.get('userId');

  const post = await c.env.DB.prepare('SELECT id FROM posts WHERE id = ?').bind(postId).first();
  if (!post) return c.json({ success: false, error: 'Post not found' }, 404);

  const result = await c.env.DB.prepare(`
    SELECT c.*,
      u.username as author_username, u.avatar_url as author_avatar
    FROM comments c
    LEFT JOIN users u ON c.author_id = u.id
    WHERE c.post_id = ?
    ORDER BY c.depth ASC, c.score DESC, c.created_at ASC
  `).bind(postId).all<CommentRow>();

  const allComments = result.results ?? [];

  // Fetch user votes
  let userVotes: Record<string, number> = {};
  if (userId && allComments.length > 0) {
    const ids = allComments.map(c => c.id);
    const placeholders = ids.map(() => '?').join(',');
    const voteRows = await c.env.DB.prepare(
      `SELECT target_id, value FROM votes WHERE user_id = ? AND target_type = 'comment' AND target_id IN (${placeholders})`
    ).bind(userId, ...ids).all<{ target_id: string; value: number }>();

    for (const v of voteRows.results ?? []) {
      userVotes[v.target_id] = v.value;
    }
  }

  // Build tree (max depth 3)
  const nodeMap = new Map<string, CommentNode>();
  const roots: CommentNode[] = [];

  for (const row of allComments) {
    if (row.depth > 3) continue;
    const node: CommentNode = {
      ...row,
      body: row.is_deleted ? '[deleted]' : row.body,
      author: { id: row.author_id, username: row.is_deleted ? '[deleted]' : row.author_username, avatar_url: row.is_deleted ? null : row.author_avatar },
      replies: [],
      user_vote: (userVotes[row.id] as 1 | -1 | undefined) ?? null,
    };
    nodeMap.set(row.id, node);
  }

  for (const node of nodeMap.values()) {
    if (node.parent_id && nodeMap.has(node.parent_id)) {
      nodeMap.get(node.parent_id)!.replies.push(node);
    } else if (!node.parent_id) {
      roots.push(node);
    }
  }

  return c.json({ success: true, data: roots });
});

// POST /posts/:id/comments — create comment
comments.post('/posts/:id/comments', authMiddleware, commentRateLimit, async (c) => {
  const userId = c.get('userId');
  const postId = c.req.param('id');

  const post = await c.env.DB.prepare(
    'SELECT id, author_id FROM posts WHERE id = ? AND is_removed = 0'
  ).bind(postId).first<{ id: string; author_id: string }>();

  if (!post) return c.json({ success: false, error: 'Post not found' }, 404);

  const body = await c.req.json<{ body?: string; parent_id?: string }>();
  if (!body.body || body.body.trim().length === 0) {
    return c.json({ success: false, error: 'Comment body is required' }, 400);
  }

  let depth = 0;
  if (body.parent_id) {
    const parent = await c.env.DB.prepare(
      'SELECT id, depth FROM comments WHERE id = ? AND post_id = ?'
    ).bind(body.parent_id, postId).first<{ id: string; depth: number }>();

    if (!parent) return c.json({ success: false, error: 'Parent comment not found' }, 404);
    if (parent.depth >= 3) return c.json({ success: false, error: 'Maximum comment depth reached' }, 400);
    depth = parent.depth + 1;
  }

  const id = generateId('cmt');
  const now = Math.floor(Date.now() / 1000);

  await c.env.DB.prepare(`
    INSERT INTO comments (id, post_id, author_id, parent_id, depth, body, upvotes, downvotes, score, is_removed, is_deleted, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, 1, 0, 1, 0, 0, ?, ?)
  `).bind(id, postId, userId, body.parent_id ?? null, depth, body.body.trim(), now, now).run();

  // Increment post comment_count
  await c.env.DB.prepare('UPDATE posts SET comment_count = comment_count + 1 WHERE id = ?').bind(postId).run();

  // Auto-vote own comment
  await c.env.DB.prepare(
    "INSERT OR IGNORE INTO votes (user_id, target_id, target_type, value, created_at) VALUES (?, ?, 'comment', 1, ?)"
  ).bind(userId, id, now).run();

  // Create notification for post author (if not self)
  if (post.author_id !== userId) {
    const notifId = generateId('ntf');
    await c.env.DB.prepare(
      "INSERT INTO notifications (id, user_id, type, actor_id, post_id, comment_id, is_read, created_at) VALUES (?, ?, 'post_reply', ?, ?, ?, 0, ?)"
    ).bind(notifId, post.author_id, userId, postId, id, now).run();
  }

  // If replying to a comment, notify that comment's author
  if (body.parent_id) {
    const parentAuthor = await c.env.DB.prepare(
      'SELECT author_id FROM comments WHERE id = ?'
    ).bind(body.parent_id).first<{ author_id: string }>();

    if (parentAuthor && parentAuthor.author_id !== userId && parentAuthor.author_id !== post.author_id) {
      const notifId = generateId('ntf');
      await c.env.DB.prepare(
        "INSERT INTO notifications (id, user_id, type, actor_id, post_id, comment_id, is_read, created_at) VALUES (?, ?, 'comment_reply', ?, ?, ?, 0, ?)"
      ).bind(notifId, parentAuthor.author_id, userId, postId, id, now).run();
    }
  }

  const created = await c.env.DB.prepare(`
    SELECT c.*, u.username as author_username, u.avatar_url as author_avatar
    FROM comments c LEFT JOIN users u ON c.author_id = u.id
    WHERE c.id = ?
  `).bind(id).first<CommentRow>();

  if (!created) return c.json({ success: false, error: 'Failed to create comment' }, 500);

  return c.json({
    success: true,
    data: {
      ...created,
      author: { id: created.author_id, username: created.author_username, avatar_url: created.author_avatar },
      replies: [],
      user_vote: 1,
    },
  }, 201);
});

// PATCH /comments/:id — edit comment (author only, within 15 min)
comments.patch('/:id', authMiddleware, async (c) => {
  const userId = c.get('userId');
  const commentId = c.req.param('id');

  const comment = await c.env.DB.prepare(
    'SELECT id, author_id, created_at, is_deleted FROM comments WHERE id = ?'
  ).bind(commentId).first<{ id: string; author_id: string; created_at: number; is_deleted: number }>();

  if (!comment) return c.json({ success: false, error: 'Comment not found' }, 404);
  if (comment.author_id !== userId) return c.json({ success: false, error: 'Forbidden' }, 403);
  if (comment.is_deleted) return c.json({ success: false, error: 'Comment has been deleted' }, 400);

  const now = Math.floor(Date.now() / 1000);
  const ageMinutes = (now - comment.created_at) / 60;
  if (ageMinutes > 15) {
    return c.json({ success: false, error: 'Comments can only be edited within 15 minutes of posting' }, 400);
  }

  const body = await c.req.json<{ body?: string }>();
  if (!body.body || body.body.trim().length === 0) {
    return c.json({ success: false, error: 'Comment body is required' }, 400);
  }

  await c.env.DB.prepare(
    'UPDATE comments SET body = ?, updated_at = ? WHERE id = ?'
  ).bind(body.body.trim(), now, commentId).run();

  const updated = await c.env.DB.prepare(`
    SELECT c.*, u.username as author_username, u.avatar_url as author_avatar
    FROM comments c LEFT JOIN users u ON c.author_id = u.id
    WHERE c.id = ?
  `).bind(commentId).first<CommentRow>();

  if (!updated) return c.json({ success: false, error: 'Comment not found' }, 404);

  return c.json({
    success: true,
    data: {
      ...updated,
      author: { id: updated.author_id, username: updated.author_username, avatar_url: updated.author_avatar },
      replies: [],
      user_vote: null,
    },
  });
});

// DELETE /comments/:id — soft delete
comments.delete('/:id', authMiddleware, async (c) => {
  const userId = c.get('userId');
  const user = c.get('user');
  const commentId = c.req.param('id');

  const comment = await c.env.DB.prepare(
    'SELECT id, author_id, post_id FROM comments WHERE id = ?'
  ).bind(commentId).first<{ id: string; author_id: string; post_id: string }>();

  if (!comment) return c.json({ success: false, error: 'Comment not found' }, 404);

  const isAuthor = comment.author_id === userId;
  const isAdmin = user?.is_admin === 1;

  if (!isAuthor && !isAdmin) {
    return c.json({ success: false, error: 'Forbidden' }, 403);
  }

  const now = Math.floor(Date.now() / 1000);
  await c.env.DB.prepare(
    "UPDATE comments SET is_deleted = 1, body = '[deleted]', updated_at = ? WHERE id = ?"
  ).bind(now, commentId).run();

  return c.json({ success: true, data: { message: 'Comment deleted' } });
});

// POST /comments/:id/vote
comments.post('/:id/vote', authMiddleware, async (c) => {
  const userId = c.get('userId');
  const commentId = c.req.param('id');

  const body = await c.req.json<{ value: 1 | -1 | 0 }>();
  if (![1, -1, 0].includes(body.value)) {
    return c.json({ success: false, error: 'value must be 1, -1, or 0' }, 400);
  }

  const comment = await c.env.DB.prepare(
    'SELECT id, author_id, upvotes, downvotes, score, created_at FROM comments WHERE id = ? AND is_deleted = 0'
  ).bind(commentId).first<{ id: string; author_id: string; upvotes: number; downvotes: number; score: number; created_at: number }>();

  if (!comment) return c.json({ success: false, error: 'Comment not found' }, 404);

  const existing = await c.env.DB.prepare(
    "SELECT value FROM votes WHERE user_id = ? AND target_id = ? AND target_type = 'comment'"
  ).bind(userId, commentId).first<{ value: number }>();

  const now = Math.floor(Date.now() / 1000);
  const oldValue = existing?.value ?? 0;
  const newValue = body.value;

  if (oldValue === newValue) {
    return c.json({ success: true, data: { message: 'Vote unchanged' } });
  }

  if (newValue === 0) {
    await c.env.DB.prepare(
      "DELETE FROM votes WHERE user_id = ? AND target_id = ? AND target_type = 'comment'"
    ).bind(userId, commentId).run();
  } else if (oldValue === 0) {
    await c.env.DB.prepare(
      "INSERT INTO votes (user_id, target_id, target_type, value, created_at) VALUES (?, ?, 'comment', ?, ?)"
    ).bind(userId, commentId, newValue, now).run();
  } else {
    await c.env.DB.prepare(
      "UPDATE votes SET value = ? WHERE user_id = ? AND target_id = ? AND target_type = 'comment'"
    ).bind(newValue, userId, commentId).run();
  }

  const upvoteDelta = (newValue === 1 ? 1 : 0) - (oldValue === 1 ? 1 : 0);
  const downvoteDelta = (newValue === -1 ? 1 : 0) - (oldValue === -1 ? 1 : 0);
  const newUpvotes = Math.max(0, comment.upvotes + upvoteDelta);
  const newDownvotes = Math.max(0, comment.downvotes + downvoteDelta);
  const newScore = newUpvotes - newDownvotes;

  await c.env.DB.prepare(
    'UPDATE comments SET upvotes = ?, downvotes = ?, score = ?, updated_at = ? WHERE id = ?'
  ).bind(newUpvotes, newDownvotes, newScore, now, commentId).run();

  if (comment.author_id !== userId) {
    const karmaDelta = newValue - oldValue;
    await c.env.DB.prepare('UPDATE users SET karma = karma + ? WHERE id = ?').bind(karmaDelta, comment.author_id).run();
  }

  return c.json({ success: true, data: { upvotes: newUpvotes, downvotes: newDownvotes, score: newScore, user_vote: newValue || null } });
});

// POST /comments/:id/report
comments.post('/:id/report', authMiddleware, async (c) => {
  const userId = c.get('userId');
  const commentId = c.req.param('id');

  const body = await c.req.json<{ reason?: string }>();
  const validReasons = ['spam', 'misinformation', 'off-topic', 'offensive'];
  if (!body.reason || !validReasons.includes(body.reason)) {
    return c.json({ success: false, error: 'reason must be one of: ' + validReasons.join(', ') }, 400);
  }

  const comment = await c.env.DB.prepare('SELECT id FROM comments WHERE id = ?').bind(commentId).first();
  if (!comment) return c.json({ success: false, error: 'Comment not found' }, 404);

  const id = generateId('rpt');
  const now = Math.floor(Date.now() / 1000);

  await c.env.DB.prepare(
    "INSERT INTO reports (id, reporter_id, target_id, target_type, reason, resolved, created_at) VALUES (?, ?, ?, 'comment', ?, 0, ?)"
  ).bind(id, userId, commentId, body.reason, now).run();

  return c.json({ success: true, data: { message: 'Report submitted' } }, 201);
});

export default comments;
