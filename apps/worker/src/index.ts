import { Hono } from 'hono';
import { cors } from 'hono/cors';

import auth from './routes/auth';
import posts from './routes/posts';
import comments from './routes/comments';
import communities from './routes/communities';
import users from './routes/users';
import search from './routes/search';
import notifications from './routes/notifications';
import upload from './routes/upload';
import mod from './routes/mod';

export type Env = {
  DB: D1Database;
  IMAGES: R2Bucket;
  JWT_SECRET: string;
  FRONTEND_URL: string;
};

const app = new Hono<{ Bindings: Env }>();

// CORS middleware
app.use('*', async (c, next) => {
  const handler = cors({
    origin: [c.env.FRONTEND_URL, 'http://localhost:3000', 'http://localhost:3001'],
    allowMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    exposeHeaders: ['Content-Length'],
    maxAge: 86400,
    credentials: true,
  });
  return handler(c, next);
});

// Health check
app.get('/health', (c) => {
  return c.json({ success: true, data: { status: 'ok', timestamp: Date.now() } });
});

// Mount routes
app.route('/auth', auth);
app.route('/posts', posts);
app.route('/', comments);           // /posts/:id/comments, /comments/:id
app.route('/communities', communities);
app.route('/users', users);
app.route('/search', search);
app.route('/notifications', notifications);
app.route('/upload', upload);
app.route('/mod', mod);

// 404 handler
app.notFound((c) => {
  return c.json({ success: false, error: `Route ${c.req.method} ${c.req.path} not found` }, 404);
});

// Error handler
app.onError((err, c) => {
  console.error('Unhandled error:', err);
  return c.json({ success: false, error: 'Internal server error' }, 500);
});

export default app;
