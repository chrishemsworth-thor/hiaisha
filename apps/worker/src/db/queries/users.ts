export interface UserRow {
  id: string;
  username: string;
  email: string;
  email_verified: number;
  password_hash: string;
  avatar_url: string | null;
  bio: string | null;
  karma: number;
  is_admin: number;
  created_at: number;
  updated_at: number;
}

export type SafeUser = Omit<UserRow, 'password_hash'>;

export async function getUserById(db: D1Database, id: string): Promise<UserRow | null> {
  return db.prepare('SELECT * FROM users WHERE id = ?').bind(id).first<UserRow>();
}

export async function getUserByUsername(db: D1Database, username: string): Promise<UserRow | null> {
  return db.prepare('SELECT * FROM users WHERE username = ?').bind(username.toLowerCase()).first<UserRow>();
}

export async function getUserByEmail(db: D1Database, email: string): Promise<UserRow | null> {
  return db.prepare('SELECT * FROM users WHERE email = ?').bind(email.toLowerCase()).first<UserRow>();
}

export function toSafeUser(user: UserRow): SafeUser {
  const { password_hash: _ph, ...safe } = user;
  return safe;
}

export async function updateUserKarma(db: D1Database, userId: string, delta: number): Promise<void> {
  await db.prepare('UPDATE users SET karma = karma + ? WHERE id = ?').bind(delta, userId).run();
}
