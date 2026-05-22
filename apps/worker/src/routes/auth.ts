import { Hono } from 'hono';
import { generateId } from '../utils/id';
import { signJWT, authMiddleware } from '../middleware/auth';

type Env = {
  DB: D1Database;
  IMAGES: R2Bucket;
  JWT_SECRET: string;
  FRONTEND_URL: string;
};

const auth = new Hono<{ Bindings: Env }>();

// ── Password hashing with PBKDF2 ──────────────────────────────────────────────

function hexEncode(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function hexDecode(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return bytes;
}

async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  const hash = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: 100_000, hash: 'SHA-256' },
    keyMaterial,
    256
  );
  return `pbkdf2:${hexEncode(salt.buffer)}:${hexEncode(hash)}`;
}

async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split(':');
  if (parts.length !== 3 || parts[0] !== 'pbkdf2') return false;
  const salt = hexDecode(parts[1]);
  const expectedHash = parts[2];

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  const hash = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: 100_000, hash: 'SHA-256' },
    keyMaterial,
    256
  );
  return hexEncode(hash) === expectedHash;
}

// ── Validation helpers ────────────────────────────────────────────────────────

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidUsername(username: string): boolean {
  return /^[a-zA-Z0-9_]{3,30}$/.test(username);
}

// ── Routes ────────────────────────────────────────────────────────────────────

// POST /auth/register
auth.post('/register', async (c) => {
  const body = await c.req.json<{ username?: string; email?: string; password?: string }>();
  const { username, email, password } = body;

  if (!username || !email || !password) {
    return c.json({ success: false, error: 'username, email, and password are required' }, 400);
  }
  if (!isValidUsername(username)) {
    return c.json({ success: false, error: 'Username must be 3–30 characters, letters/numbers/underscores only' }, 400);
  }
  if (!isValidEmail(email)) {
    return c.json({ success: false, error: 'Invalid email address' }, 400);
  }
  if (password.length < 8) {
    return c.json({ success: false, error: 'Password must be at least 8 characters' }, 400);
  }

  // Check uniqueness
  const existing = await c.env.DB.prepare(
    'SELECT id FROM users WHERE username = ? OR email = ?'
  ).bind(username.toLowerCase(), email.toLowerCase()).first<{ id: string }>();

  if (existing) {
    return c.json({ success: false, error: 'Username or email already taken' }, 409);
  }

  const id = generateId('usr');
  const passwordHash = await hashPassword(password);
  const now = Math.floor(Date.now() / 1000);

  await c.env.DB.prepare(
    `INSERT INTO users (id, username, email, password_hash, karma, is_admin, email_verified, created_at, updated_at)
     VALUES (?, ?, ?, ?, 0, 0, 0, ?, ?)`
  ).bind(id, username.toLowerCase(), email.toLowerCase(), passwordHash, now, now).run();

  const token = await signJWT({ sub: id, username: username.toLowerCase(), is_admin: 0 }, c.env.JWT_SECRET);

  const user = {
    id,
    username: username.toLowerCase(),
    email_verified: 0,
    avatar_url: null,
    bio: null,
    karma: 0,
    is_admin: 0,
    created_at: now,
    updated_at: now,
  };

  return c.json({ success: true, data: { token, user } }, 201);
});

// POST /auth/login
auth.post('/login', async (c) => {
  const body = await c.req.json<{ email?: string; password?: string }>();
  const { email, password } = body;

  if (!email || !password) {
    return c.json({ success: false, error: 'email and password are required' }, 400);
  }

  const user = await c.env.DB.prepare(
    'SELECT * FROM users WHERE email = ?'
  ).bind(email.toLowerCase()).first<{
    id: string; username: string; email: string; password_hash: string;
    email_verified: number; avatar_url: string | null; bio: string | null;
    karma: number; is_admin: number; created_at: number; updated_at: number;
  }>();

  if (!user) {
    return c.json({ success: false, error: 'Invalid email or password' }, 401);
  }

  const valid = await verifyPassword(password, user.password_hash);
  if (!valid) {
    return c.json({ success: false, error: 'Invalid email or password' }, 401);
  }

  const token = await signJWT(
    { sub: user.id, username: user.username, is_admin: user.is_admin },
    c.env.JWT_SECRET
  );

  const { password_hash: _ph, ...safeUser } = user;
  return c.json({ success: true, data: { token, user: safeUser } });
});

// POST /auth/logout (client-side only)
auth.post('/logout', (c) => {
  return c.json({ success: true, data: { message: 'Logged out' } });
});

// GET /auth/me
auth.get('/me', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ success: false, error: 'Unauthorized' }, 401);
  }

  // Run auth middleware inline
  await authMiddleware(c as never, async () => {});

  const userId = c.get('userId' as never) as string | undefined;
  if (!userId) {
    return c.json({ success: false, error: 'Unauthorized' }, 401);
  }

  const user = await c.env.DB.prepare(
    'SELECT id, username, email, email_verified, avatar_url, bio, karma, is_admin, created_at, updated_at FROM users WHERE id = ?'
  ).bind(userId).first();

  if (!user) {
    return c.json({ success: false, error: 'User not found' }, 404);
  }

  return c.json({ success: true, data: user });
});

// POST /auth/verify-email
auth.post('/verify-email', async (c) => {
  const body = await c.req.json<{ token?: string; userId?: string }>();
  const { userId } = body;

  if (!userId) {
    return c.json({ success: false, error: 'userId is required' }, 400);
  }

  const now = Math.floor(Date.now() / 1000);
  await c.env.DB.prepare(
    'UPDATE users SET email_verified = 1, updated_at = ? WHERE id = ?'
  ).bind(now, userId).run();

  return c.json({ success: true, data: { message: 'Email verified' } });
});

// POST /auth/resend-verification (Resend integration placeholder)
auth.post('/resend-verification', async (c) => {
  // TODO: integrate Resend email service
  // const body = await c.req.json<{ email?: string }>();
  // await sendVerificationEmail(body.email, c.env.RESEND_API_KEY);
  return c.json({ success: true, data: { message: 'Verification email sent (if account exists)' } });
});

export default auth;
