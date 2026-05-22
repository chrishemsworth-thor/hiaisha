export interface CommunityRow {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  banner_url: string | null;
  icon_url: string | null;
  member_count: number;
  post_count: number;
  created_by: string | null;
  created_at: number;
}

export async function getCommunityBySlug(db: D1Database, slug: string): Promise<CommunityRow | null> {
  return db.prepare('SELECT * FROM communities WHERE slug = ?').bind(slug).first<CommunityRow>();
}

export async function getCommunityById(db: D1Database, id: string): Promise<CommunityRow | null> {
  return db.prepare('SELECT * FROM communities WHERE id = ?').bind(id).first<CommunityRow>();
}

export async function getAllCommunities(db: D1Database): Promise<CommunityRow[]> {
  const result = await db.prepare('SELECT * FROM communities ORDER BY member_count DESC').all<CommunityRow>();
  return result.results ?? [];
}

export async function isMember(db: D1Database, userId: string, communityId: string): Promise<boolean> {
  const row = await db.prepare(
    'SELECT user_id FROM community_members WHERE user_id = ? AND community_id = ?'
  ).bind(userId, communityId).first();
  return !!row;
}

export async function getMemberRole(
  db: D1Database,
  userId: string,
  communityId: string
): Promise<string | null> {
  const row = await db.prepare(
    'SELECT role FROM community_members WHERE user_id = ? AND community_id = ?'
  ).bind(userId, communityId).first<{ role: string }>();
  return row?.role ?? null;
}
