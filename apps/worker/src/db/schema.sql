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

-- Seed communities
INSERT OR IGNORE INTO communities (id, slug, name, description, member_count, post_count, created_at) VALUES
  ('comm_kl', 'kuala-lumpur', 'Kuala Lumpur', 'KL food scene — from KLCC to Chow Kit', 0, 0, unixepoch()),
  ('comm_pg', 'penang', 'Penang', 'Penang food — the real hawker capital', 0, 0, unixepoch()),
  ('comm_jb', 'johor-bahru', 'Johor Bahru', 'JB food + Singapore crossover eats', 0, 0, unixepoch()),
  ('comm_ip', 'ipoh', 'Ipoh', 'Ipoh food — tau fu fah, dim sum, white coffee', 0, 0, unixepoch()),
  ('comm_es', 'sabah-sarawak', 'Sabah & Sarawak', 'East Malaysia food gems', 0, 0, unixepoch()),
  ('comm_sf', 'street-food', 'Street Food', 'Hawker stalls, pasar malam, roadside gems', 0, 0, unixepoch()),
  ('comm_mm', 'mamak', 'Mamak', 'Mamak culture deserves its own space — roti canai, teh tarik', 0, 0, unixepoch()),
  ('comm_bc', 'baking-cooking', 'Baking & Cooking', 'Home cooking, recipes, baking adventures', 0, 0, unixepoch()),
  ('comm_hf', 'halal-finds', 'Halal Finds', 'Halal-certified recommendations across Malaysia', 0, 0, unixepoch()),
  ('comm_be', 'budget-eats', 'Budget Eats', 'Cheap and good, under RM15', 0, 0, unixepoch()),
  ('comm_no', 'new-openings', 'New Openings', 'Restaurant launches and new spots to try', 0, 0, unixepoch()),
  ('comm_rp', 'rant-praise', 'Rant & Praise', 'Reviews, hot takes, and honest opinions', 0, 0, unixepoch());
