-- Users
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  email_verified INTEGER DEFAULT 0,
  password_hash TEXT NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  karma INTEGER DEFAULT 0,
  is_admin INTEGER DEFAULT 0,
  notification_emails INTEGER DEFAULT 1,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Communities (Makan Spots)
CREATE TABLE IF NOT EXISTS communities (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  banner_url TEXT,
  icon_url TEXT,
  member_count INTEGER DEFAULT 0,
  post_count INTEGER DEFAULT 0,
  created_by TEXT REFERENCES users(id),
  created_at INTEGER NOT NULL
);

-- Community Members
CREATE TABLE IF NOT EXISTS community_members (
  user_id TEXT REFERENCES users(id),
  community_id TEXT REFERENCES communities(id),
  role TEXT DEFAULT 'member',
  joined_at INTEGER NOT NULL,
  PRIMARY KEY (user_id, community_id)
);

-- Posts
CREATE TABLE IF NOT EXISTS posts (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  body TEXT,
  post_type TEXT NOT NULL,
  author_id TEXT REFERENCES users(id),
  community_id TEXT REFERENCES communities(id),
  location_tag TEXT,
  upvotes INTEGER DEFAULT 0,
  downvotes INTEGER DEFAULT 0,
  score INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  hot_score REAL DEFAULT 0,
  is_removed INTEGER DEFAULT 0,
  is_pinned INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Post Images
CREATE TABLE IF NOT EXISTS post_images (
  id TEXT PRIMARY KEY,
  post_id TEXT REFERENCES posts(id),
  url TEXT NOT NULL,
  position INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);

-- Post Tags
CREATE TABLE IF NOT EXISTS post_tags (
  post_id TEXT REFERENCES posts(id),
  tag TEXT NOT NULL,
  PRIMARY KEY (post_id, tag)
);

-- Comments
CREATE TABLE IF NOT EXISTS comments (
  id TEXT PRIMARY KEY,
  post_id TEXT REFERENCES posts(id),
  author_id TEXT REFERENCES users(id),
  parent_id TEXT REFERENCES comments(id),
  depth INTEGER DEFAULT 0,
  body TEXT NOT NULL,
  upvotes INTEGER DEFAULT 0,
  downvotes INTEGER DEFAULT 0,
  score INTEGER DEFAULT 0,
  is_removed INTEGER DEFAULT 0,
  is_deleted INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Votes
CREATE TABLE IF NOT EXISTS votes (
  user_id TEXT REFERENCES users(id),
  target_id TEXT NOT NULL,
  target_type TEXT NOT NULL,
  value INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (user_id, target_id, target_type)
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  type TEXT NOT NULL,
  actor_id TEXT REFERENCES users(id),
  post_id TEXT,
  comment_id TEXT,
  is_read INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL
);

-- Reports
CREATE TABLE IF NOT EXISTS reports (
  id TEXT PRIMARY KEY,
  reporter_id TEXT REFERENCES users(id),
  target_id TEXT NOT NULL,
  target_type TEXT NOT NULL,
  reason TEXT NOT NULL,
  resolved INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_posts_community_id ON posts(community_id);
CREATE INDEX IF NOT EXISTS idx_posts_author_id ON posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_hot_score ON posts(hot_score DESC);
CREATE INDEX IF NOT EXISTS idx_posts_score ON posts(score DESC);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_author_id ON comments(author_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_votes_target ON votes(target_id, target_type);

-- FTS index
CREATE VIRTUAL TABLE IF NOT EXISTS posts_fts USING fts5(
  title, body, content='posts', content_rowid='rowid'
);

-- Migrations
ALTER TABLE users ADD COLUMN notification_emails INTEGER DEFAULT 1;
ALTER TABLE users ADD COLUMN is_banned INTEGER DEFAULT 0;

-- Seed communities
INSERT OR IGNORE INTO communities (id, slug, name, description, member_count, post_count, created_at) VALUES
  ('comm_my', 'malaysia', 'Malaysia', 'Semua benda pasal Malaysia — boleh tanya, share, discuss apa-apa saja', 0, 0, unixepoch()),
  ('comm_ns', 'berita-semasa', 'Berita Semasa', 'Latest Malaysian news, current affairs, and breaking stories', 0, 0, unixepoch()),
  ('comm_pk', 'politik', 'Politik & PRU', 'Malaysian politics, elections, government policy — discuss dengan berhemah', 0, 0, unixepoch()),
  ('comm_sp', 'sukan', 'Sukan', 'Harimau Malaya, badminton, F1, MotoGP — semua sukan ada di sini', 0, 0, unixepoch()),
  ('comm_tx', 'teknologi', 'Teknologi & Gaming', 'Tech news, gadgets, gaming, apps, and all things digital', 0, 0, unixepoch()),
  ('comm_hb', 'hiburan', 'Hiburan', 'Malaysian entertainment, K-drama, local films, music, and pop culture', 0, 0, unixepoch()),
  ('comm_kw', 'kewangan', 'Kewangan & Pelaburan', 'Personal finance, KLSE, unit trusts, crypto, and investment talk', 0, 0, unixepoch()),
  ('comm_pd', 'pendidikan', 'Pendidikan & Kerjaya', 'SPM, STPM, university, job hunting, career advice — tanya je lah', 0, 0, unixepoch()),
  ('comm_gl', 'gaya-hidup', 'Gaya Hidup', 'Health, fitness, travel, parenting, fashion, and everyday Malaysian life', 0, 0, unixepoch()),
  ('comm_mk', 'makan', 'Makan', 'Best makan spots, hawker stalls, recipes, and food reviews across Malaysia', 0, 0, unixepoch()),
  ('comm_mm', 'meme-malaysia', 'Meme Malaysia', 'Lawak, meme, viral content — asal ada unsur Malaysia boleh masuk', 0, 0, unixepoch()),
  ('comm_rp', 'rant-praise', 'Rant & Lepas Geram', 'Hot takes, rants, praise, unpopular opinions — lepas je lah');
