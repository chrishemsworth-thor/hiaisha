import { Hono } from 'hono';
import { generateId } from '../utils/id';
import { authMiddleware } from '../middleware/auth';

type Env = {
  DB: D1Database;
  IMAGES: R2Bucket;
  JWT_SECRET: string;
  FRONTEND_URL: string;
  R2_PUBLIC_URL: string;
};

type Variables = {
  userId: string;
  user: { sub: string; username: string; is_admin: number; iat: number; exp: number };
};

const upload = new Hono<{ Bindings: Env; Variables: Variables }>();

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

// POST /upload/image — upload image to R2
upload.post('/image', authMiddleware, async (c) => {
  const formData = await c.req.formData();
  const file = formData.get('file') as File | null;

  if (!file) {
    return c.json({ success: false, error: 'No file provided' }, 400);
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return c.json({ success: false, error: 'Only JPEG, PNG, and WebP images are allowed' }, 400);
  }

  if (file.size > MAX_SIZE) {
    return c.json({ success: false, error: 'File size must be 5MB or less' }, 400);
  }

  const ext = file.type.split('/')[1] === 'jpeg' ? 'jpg' : file.type.split('/')[1];
  const key = `uploads/${generateId('img')}.${ext}`;

  const arrayBuffer = await file.arrayBuffer();

  await c.env.IMAGES.put(key, arrayBuffer, {
    httpMetadata: {
      contentType: file.type,
      cacheControl: 'public, max-age=31536000',
    },
  });

  // Build public URL from env var (set R2_PUBLIC_URL in wrangler.toml [vars])
  const bucketUrl = `${c.env.R2_PUBLIC_URL}/${key}`;

  return c.json({ success: true, data: { url: bucketUrl, key } }, 201);
});

export default upload;
