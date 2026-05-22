export interface User {
  id: string;
  username: string;
  email?: string;
  email_verified: number;
  avatar_url: string | null;
  bio: string | null;
  karma: number;
  is_admin: number;
  created_at: number;
  updated_at: number;
}

export interface Community {
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
  is_member?: boolean;
}

export interface CommunityMember {
  user_id: string;
  community_id: string;
  role: 'member' | 'moderator' | 'admin';
  joined_at: number;
}

export interface Post {
  id: string;
  title: string;
  body: string | null;
  post_type: 'text' | 'image';
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
  author?: Pick<User, 'id' | 'username' | 'avatar_url'>;
  community?: Pick<Community, 'id' | 'slug' | 'name'>;
  images?: PostImage[];
  tags?: string[];
  user_vote?: 1 | -1 | null;
}

export interface PostImage {
  id: string;
  post_id: string;
  url: string;
  position: number;
  created_at: number;
}

export interface PostTag {
  post_id: string;
  tag: string;
}

export interface Comment {
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
  author?: Pick<User, 'id' | 'username' | 'avatar_url'>;
  replies?: Comment[];
  user_vote?: 1 | -1 | null;
}

export interface Vote {
  user_id: string;
  target_id: string;
  target_type: 'post' | 'comment';
  value: 1 | -1;
  created_at: number;
}

export interface Notification {
  id: string;
  user_id: string;
  type: 'comment_reply' | 'post_reply' | 'mention';
  actor_id: string;
  post_id: string | null;
  comment_id: string | null;
  is_read: number;
  created_at: number;
  actor?: Pick<User, 'id' | 'username' | 'avatar_url'>;
  post?: Pick<Post, 'id' | 'title'>;
}

export interface Report {
  id: string;
  reporter_id: string;
  target_id: string;
  target_type: 'post' | 'comment';
  reason: 'spam' | 'misinformation' | 'off-topic' | 'offensive';
  resolved: number;
  created_at: number;
}

export type FeedSort = 'hot' | 'new' | 'top';
export type TimeFilter = 'today' | 'week' | 'month' | 'all';

export interface PaginatedResponse<T> {
  data: T[];
  cursor: string | null;
  hasMore: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

// API Request types
export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface CreatePostRequest {
  title: string;
  body?: string;
  post_type: 'text' | 'image';
  community_id: string;
  location_tag?: string;
  tags?: string[];
  image_urls?: string[];
}

export interface UpdatePostRequest {
  body?: string;
  location_tag?: string;
  tags?: string[];
}

export interface CreateCommentRequest {
  body: string;
  parent_id?: string;
}

export interface VoteRequest {
  value: 1 | -1 | 0;
}

export interface UpdateProfileRequest {
  bio?: string;
  avatar_url?: string;
}

export interface CreateCommunityRequest {
  slug: string;
  name: string;
  description?: string;
}

export interface ReportRequest {
  reason: 'spam' | 'misinformation' | 'off-topic' | 'offensive';
}

export interface SearchRequest {
  q: string;
  community?: string;
  sort?: 'relevance' | 'recent';
  cursor?: string;
}
