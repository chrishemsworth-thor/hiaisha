import { calculateHotScore } from '../../utils/hotScore';

export interface PostRow {
  id: string;
  title: string;
  body: string | null;
  post_type: string;
  author_id: string;
  community_id: string;
  location_tag: string | null;
  upvotes: number;
  downvotes: number;
  score: number;
  comment_count: number;
  hot_score: number;
  is_removed: number;
  is_pinned: number;
  created_at: number;
  updated_at: number;
}

export async function getPostById(db: D1Database, id: string): Promise<PostRow | null> {
  return db.prepare('SELECT * FROM posts WHERE id = ? AND is_removed = 0').bind(id).first<PostRow>();
}

export async function updatePostVoteScore(
  db: D1Database,
  postId: string,
  upvotes: number,
  downvotes: number,
  createdAt: number
): Promise<void> {
  const score = upvotes - downvotes;
  const hotScore = calculateHotScore(score, createdAt);
  const now = Math.floor(Date.now() / 1000);
  await db.prepare(
    'UPDATE posts SET upvotes = ?, downvotes = ?, score = ?, hot_score = ?, updated_at = ? WHERE id = ?'
  ).bind(upvotes, downvotes, score, hotScore, now, postId).run();
}

export async function getPostsWithAuthors(
  db: D1Database,
  params: {
    communityId?: string;
    authorId?: string;
    sort?: string;
    limit?: number;
    cursor?: string;
    timeFilter?: number;
  }
): Promise<PostRow[]> {
  const limit = params.limit ?? 20;
  const sort = params.sort ?? 'hot';
  const timeFilter = params.timeFilter ?? 0;

  let orderBy: string;
  switch (sort) {
    case 'new': orderBy = 'p.created_at DESC'; break;
    case 'top': orderBy = 'p.score DESC, p.created_at DESC'; break;
    default: orderBy = 'p.hot_score DESC, p.created_at DESC';
  }

  let query = 'SELECT p.* FROM posts p WHERE p.is_removed = 0';
  const bindParams: (string | number)[] = [];

  if (params.communityId) {
    query += ' AND p.community_id = ?';
    bindParams.push(params.communityId);
  }

  if (params.authorId) {
    query += ' AND p.author_id = ?';
    bindParams.push(params.authorId);
  }

  if (timeFilter > 0) {
    query += ' AND p.created_at >= ?';
    bindParams.push(timeFilter);
  }

  if (params.cursor) {
    if (sort === 'new') {
      query += ' AND p.created_at < ?';
      bindParams.push(parseInt(params.cursor));
    } else {
      query += ' AND p.hot_score < ?';
      bindParams.push(parseFloat(params.cursor));
    }
  }

  query += ` ORDER BY ${orderBy} LIMIT ?`;
  bindParams.push(limit);

  const result = await db.prepare(query).bind(...bindParams).all<PostRow>();
  return result.results ?? [];
}
