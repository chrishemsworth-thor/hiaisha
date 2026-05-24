import { Hono } from 'hono';
import { generateId } from '../utils/id';
import { signJWT, verifyJWT } from '../middleware/auth';

type Env = {
  DB: D1Database;
  IMAGES: R2Bucket;
  JWT_SECRET: string;
  FRONTEND_URL: string;
  MAILGUN_API_KEY: string;
  MAILGUN_DOMAIN: string;
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

// ── Email verification token helpers ─────────────────────────────────────────

/**
 * Sign a short-lived verification token (24h) using HMAC-SHA256.
 * Payload: { action: 'email-verify', sub: userId, email }
 */
async function signVerificationToken(
  userId: string,
  email: string,
  secret: string
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    action: 'email-verify',
    sub: userId,
    email,
    iat: now,
    exp: now + 24 * 3600, // 24 hours
  };

  function base64urlEncode(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  }

  const header = base64urlEncode(new TextEncoder().encode(JSON.stringify({ alg: 'HS256', typ: 'JWT' })));
  const body = base64urlEncode(new TextEncoder().encode(JSON.stringify(payload)));
  const signingInput = `${header}.${body}`;

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(signingInput));
  return `${signingInput}.${base64urlEncode(signature)}`;
}

async function verifyVerificationToken(
  token: string,
  secret: string
): Promise<{ sub: string; email: string } | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    function base64urlDecode(str: string): Uint8Array {
      const padded = str + '=='.slice(0, (4 - (str.length % 4)) % 4);
      const b64 = padded.replace(/-/g, '+').replace(/_/g, '/');
      const binary = atob(b64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      return bytes;
    }

    function base64urlEncode(buffer: ArrayBuffer): string {
      const bytes = new Uint8Array(buffer);
      let binary = '';
      for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
      return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    }

    const [header, body, sig] = parts;
    const signingInput = `${header}.${body}`;

    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );
    const sigBytes = base64urlDecode(sig);
    const valid = await crypto.subtle.verify('HMAC', key, sigBytes, new TextEncoder().encode(signingInput));
    if (!valid) return null;

    const payload = JSON.parse(new TextDecoder().decode(base64urlDecode(body)));
    if (payload.action !== 'email-verify') return null;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;

    return { sub: payload.sub as string, email: payload.email as string };
  } catch {
    return null;
  }
}

// ── Mailgun email sender ──────────────────────────────────────────────────────

async function sendVerificationEmail(
  to: string,
  username: string,
  verifyUrl: string,
  domain: string,
  apiKey: string
): Promise<void> {
  const formData = new FormData();
  formData.append('from', `Hiaisha 🌶️ <noreply@${domain}>`);
  formData.append('to', to);
  formData.append('subject', 'Verify your Hiaisha email 🌶️');
  formData.append(
    'html',
    `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F5F4F0;font-family:'Plus Jakarta Sans',Arial,sans-serif">
  <div style="max-width:520px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb">
    <div style="background:#C0392B;padding:24px 32px">
      <h1 style="margin:0;color:#fff;font-size:24px;font-weight:800;letter-spacing:-0.5px">Hiaisha 🌶️</h1>
      <p style="margin:4px 0 0;color:rgba(255,255,255,0.85);font-size:13px">Malaysia's makan community</p>
    </div>
    <div style="padding:32px">
      <h2 style="margin:0 0 8px;color:#1A1A1A;font-size:20px;font-weight:700">Hi ${username}, selamat datang!</h2>
      <p style="color:#6B7280;font-size:14px;line-height:1.6;margin:0 0 24px">
        Thanks for joining Hiaisha! Please verify your email address to unlock all features and start sharing your makan finds.
      </p>
      <a href="${verifyUrl}"
         style="display:inline-block;background:#C0392B;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:600;font-size:15px">
        Verify my email →
      </a>
      <p style="color:#9CA3AF;font-size:12px;margin:24px 0 0;line-height:1.5">
        This link expires in 24 hours. If you didn't create a Hiaisha account, you can safely ignore this email.
      </p>
    </div>
    <div style="background:#F5F4F0;padding:16px 32px;border-top:1px solid #e5e7eb">
      <p style="margin:0;color:#9CA3AF;font-size:12px">
        Can't click the button? Copy this link:<br>
        <span style="color:#C0392B;word-break:break-all">${verifyUrl}</span>
      </p>
    </div>
  </div>
</body>
</html>`
  );
  formData.append(
    'text',
    `Hi ${username}, selamat datang!\n\nVerify your Hiaisha email by visiting:\n${verifyUrl}\n\nThis link expires in 24 hours.`
  );

  const credentials = btoa(`api:${apiKey}`);
  const response = await fetch(`https://api.mailgun.net/v3/${domain}/messages`, {
    method: 'POST',
    headers: { Authorization: `Basic ${credentials}` },
    body: formData,
  });

  if (!response.ok) {
    const text = await response.text();
    console.error('Mailgun error:', response.status, text);
    throw new Error(`Failed to send verification email: ${response.status}`);
  }
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
    `INSERT INTO users (id, username, email, password_hash, karma, is_admin, email_verified, notification_emails, created_at, updated_at)
     VALUES (?, ?, ?, ?, 0, 0, 0, 1, ?, ?)`
  ).bind(id, username.toLowerCase(), email.toLowerCase(), passwordHash, now, now).run();

  // Send verification email (non-blocking – don't fail registration if email fails)
  try {
    if (c.env.MAILGUN_API_KEY && c.env.MAILGUN_DOMAIN) {
      const verifyToken = await signVerificationToken(id, email.toLowerCase(), c.env.JWT_SECRET);
      const verifyUrl = `${c.env.FRONTEND_URL}/verify-email?token=${encodeURIComponent(verifyToken)}`;
      await sendVerificationEmail(
        email.toLowerCase(),
        username.toLowerCase(),
        verifyUrl,
        c.env.MAILGUN_DOMAIN,
        c.env.MAILGUN_API_KEY
      );
    }
  } catch (err) {
    console.error('Failed to send verification email:', err);
  }

  const token = await signJWT({ sub: id, username: username.toLowerCase(), is_admin: 0 }, c.env.JWT_SECRET);

  const user = {
    id,
    username: username.toLowerCase(),
    email: email.toLowerCase(),
    email_verified: 0,
    avatar_url: null,
    bio: null,
    karma: 0,
    is_admin: 0,
    notification_emails: 1,
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
    karma: number; is_admin: number; notification_emails: number;
    created_at: number; updated_at: number;
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

  const token = authHeader.slice(7);
  const payload = await verifyJWT(token, c.env.JWT_SECRET);
  if (!payload) {
    return c.json({ success: false, error: 'Invalid or expired token' }, 401);
  }

  const user = await c.env.DB.prepare(
    'SELECT id, username, email, email_verified, avatar_url, bio, karma, is_admin, notification_emails, created_at, updated_at FROM users WHERE id = ?'
  ).bind(payload.sub).first();

  if (!user) {
    return c.json({ success: false, error: 'User not found' }, 404);
  }

  return c.json({ success: true, data: user });
});

// POST /auth/verify-email
auth.post('/verify-email', async (c) => {
  const body = await c.req.json<{ token?: string }>();
  const { token } = body;

  if (!token) {
    return c.json({ success: false, error: 'token is required' }, 400);
  }

  const payload = await verifyVerificationToken(token, c.env.JWT_SECRET);
  if (!payload) {
    return c.json({ success: false, error: 'Invalid or expired verification token' }, 400);
  }

  // Ensure user exists and email matches
  const user = await c.env.DB.prepare(
    'SELECT id, email, email_verified FROM users WHERE id = ?'
  ).bind(payload.sub).first<{ id: string; email: string; email_verified: number }>();

  if (!user) {
    return c.json({ success: false, error: 'User not found' }, 404);
  }

  if (user.email !== payload.email) {
    return c.json({ success: false, error: 'Token email mismatch' }, 400);
  }

  if (user.email_verified) {
    return c.json({ success: true, data: { message: 'Email already verified' } });
  }

  const now = Math.floor(Date.now() / 1000);
  await c.env.DB.prepare(
    'UPDATE users SET email_verified = 1, updated_at = ? WHERE id = ?'
  ).bind(now, payload.sub).run();

  return c.json({ success: true, data: { message: 'Email verified successfully' } });
});

// POST /auth/resend-verification
auth.post('/resend-verification', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ success: false, error: 'Unauthorized' }, 401);
  }

  const token = authHeader.slice(7);
  const jwtPayload = await verifyJWT(token, c.env.JWT_SECRET);
  if (!jwtPayload) {
    return c.json({ success: false, error: 'Invalid or expired token' }, 401);
  }

  const user = await c.env.DB.prepare(
    'SELECT id, username, email, email_verified FROM users WHERE id = ?'
  ).bind(jwtPayload.sub).first<{ id: string; username: string; email: string; email_verified: number }>();

  if (!user) {
    return c.json({ success: false, error: 'User not found' }, 404);
  }

  if (user.email_verified) {
    return c.json({ success: true, data: { message: 'Email already verified' } });
  }

  try {
    if (c.env.MAILGUN_API_KEY && c.env.MAILGUN_DOMAIN) {
      const verifyToken = await signVerificationToken(user.id, user.email, c.env.JWT_SECRET);
      const verifyUrl = `${c.env.FRONTEND_URL}/verify-email?token=${encodeURIComponent(verifyToken)}`;
      await sendVerificationEmail(
        user.email,
        user.username,
        verifyUrl,
        c.env.MAILGUN_DOMAIN,
        c.env.MAILGUN_API_KEY
      );
    }
  } catch (err) {
    console.error('Failed to resend verification email:', err);
    return c.json({ success: false, error: 'Failed to send verification email' }, 500);
  }

  return c.json({ success: true, data: { message: 'Verification email sent' } });
});

// POST /auth/change-password
auth.post('/change-password', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ success: false, error: 'Unauthorized' }, 401);
  }

  const token = authHeader.slice(7);
  const jwtPayload = await verifyJWT(token, c.env.JWT_SECRET);
  if (!jwtPayload) {
    return c.json({ success: false, error: 'Invalid or expired token' }, 401);
  }

  const body = await c.req.json<{ old_password?: string; new_password?: string }>();
  const { old_password, new_password } = body;

  if (!old_password || !new_password) {
    return c.json({ success: false, error: 'old_password and new_password are required' }, 400);
  }
  if (new_password.length < 8) {
    return c.json({ success: false, error: 'New password must be at least 8 characters' }, 400);
  }
  if (old_password === new_password) {
    return c.json({ success: false, error: 'New password must be different from old password' }, 400);
  }

  const user = await c.env.DB.prepare(
    'SELECT id, password_hash FROM users WHERE id = ?'
  ).bind(jwtPayload.sub).first<{ id: string; password_hash: string }>();

  if (!user) {
    return c.json({ success: false, error: 'User not found' }, 404);
  }

  const valid = await verifyPassword(old_password, user.password_hash);
  if (!valid) {
    return c.json({ success: false, error: 'Current password is incorrect' }, 400);
  }

  const newHash = await hashPassword(new_password);
  const now = Math.floor(Date.now() / 1000);
  await c.env.DB.prepare(
    'UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?'
  ).bind(newHash, now, user.id).run();

  return c.json({ success: true, data: { message: 'Password updated successfully' } });
});

export default auth;
