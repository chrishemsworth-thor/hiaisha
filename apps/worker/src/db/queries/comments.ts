export interface CommentRow {
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
}

export async function getCommentsByPostId(db: D1Database, postId: string): Promise<CommentRow[]> {
  const result = await db.prepare(`
    SELECT * FROM comments
    WHERE post_id = ? AND depth <= 3
    ORDER BY depth ASC, score DESC, created_at ASC
  `).bind(postId).all<CommentRow>();
  return result.results ?? [];
}

export async function getCommentById(db: D1Database, id: string): Promise<CommentRow | null> {
  return db.prepare('SELECT * FROM comments WHERE id = ?').bind(id).first<CommentRow>();
}

export async function updateCommentVoteScore(
  db: D1Database,
  commentId: string,
  upvotes: number,
  downvotes: number
): Promise<void> {
  const score = upvotes - downvotes;
  const now = Math.floor(Date.now() / 1000);
  await db.prepare(
    'UPDATE comments SET upvotes = ?, downvotes = ?, score = ?, updated_at = ? WHERE id = ?'
  ).bind(upvotes, downvotes, score, now, commentId).run();
}

export function buildCommentTree(
  comments: (CommentRow & { author_username: string; author_avatar: string | null; user_vote?: 1 | -1 | null })[]
): Array<CommentRow & { author: { id: string; username: string; avatar_url: string | null }; replies: unknown[]; user_vote: 1 | -1 | null }> {
  type EnrichedComment = CommentRow & {
    author: { id: string; username: string; avatar_url: string | null };
    author_username: string;
    author_avatar: string | null;
    replies: EnrichedComment[];
    user_vote: 1 | -1 | null;
  };

  const map = new Map<string, EnrichedComment>();
  const roots: EnrichedComment[] = [];

  for (const c of comments) {
    const node: EnrichedComment = {
      ...c,
      author: { id: c.author_id, username: c.author_username, avatar_url: c.author_avatar },
      replies: [],
      user_vote: c.user_vote ?? null,
    };
    map.set(c.id, node);
  }

  for (const node of map.values()) {
    if (node.parent_id && map.has(node.parent_id)) {
      map.get(node.parent_id)!.replies.push(node);
    } else if (!node.parent_id) {
      roots.push(node);
    }
  }

  return roots;
}
