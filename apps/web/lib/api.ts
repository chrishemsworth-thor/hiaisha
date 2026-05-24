import { getToken } from './auth';
import type {
  Post, Comment, Community, User, Notification,
  PaginatedResponse, ApiResponse, AuthResponse, FeedSort, TimeFilter
} from '@hiaisha/types';

const BASE = process.env.NEXT_PUBLIC_API_URL ?? '/api';

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? 'Request failed');
  return json;
}

// Auth
export const register = (body: { username: string; email: string; password: string }) =>
  request<ApiResponse<AuthResponse>>('/auth/register', { method: 'POST', body: JSON.stringify(body) });

export const login = (body: { email: string; password: string }) =>
  request<ApiResponse<AuthResponse>>('/auth/login', { method: 'POST', body: JSON.stringify(body) });

export const getMe = () => request<ApiResponse<User>>('/auth/me');

// Communities
export const getCommunities = () => request<ApiResponse<Community[]>>('/communities');
export const getCommunity = (slug: string) => request<ApiResponse<Community>>(`/communities/${slug}`);
export const joinCommunity = (slug: string) =>
  request<ApiResponse<null>>(`/communities/${slug}/join`, { method: 'POST' });
export const leaveCommunity = (slug: string) =>
  request<ApiResponse<null>>(`/communities/${slug}/join`, { method: 'DELETE' });
export const getCommunityPosts = (slug: string, params: { sort?: FeedSort; time?: TimeFilter; cursor?: string }) => {
  const q = new URLSearchParams(params as Record<string, string>).toString();
  return request<ApiResponse<PaginatedResponse<Post>>>(`/communities/${slug}/posts?${q}`);
};

// Posts
export const getPosts = (params: { sort?: FeedSort; time?: TimeFilter; cursor?: string; limit?: string }) => {
  const q = new URLSearchParams(params as Record<string, string>).toString();
  return request<ApiResponse<PaginatedResponse<Post>>>(`/posts?${q}`);
};
export const getPost = (id: string) => request<ApiResponse<Post>>(`/posts/${id}`);
export const createPost = (body: {
  title: string; body?: string; post_type: 'text' | 'image';
  community_id: string; location_tag?: string; tags?: string[]; image_urls?: string[];
}) => request<ApiResponse<Post>>('/posts', { method: 'POST', body: JSON.stringify(body) });
export const votePost = (id: string, value: 1 | -1) =>
  request<ApiResponse<null>>(`/posts/${id}/vote`, { method: 'POST', body: JSON.stringify({ value }) });
export const reportPost = (id: string, reason: string) =>
  request<ApiResponse<null>>(`/posts/${id}/report`, { method: 'POST', body: JSON.stringify({ reason }) });

// Comments
export const getComments = (postId: string) => request<ApiResponse<Comment[]>>(`/posts/${postId}/comments`);
export const createComment = (postId: string, body: { body: string; parent_id?: string }) =>
  request<ApiResponse<Comment>>(`/posts/${postId}/comments`, { method: 'POST', body: JSON.stringify(body) });
export const voteComment = (id: string, value: 1 | -1) =>
  request<ApiResponse<null>>(`/comments/${id}/vote`, { method: 'POST', body: JSON.stringify({ value }) });

// Users
export const getUser = (username: string) => request<ApiResponse<User>>(`/users/${username}`);
export const getUserPosts = (username: string, cursor?: string) => {
  const q = cursor ? `?cursor=${cursor}` : '';
  return request<ApiResponse<PaginatedResponse<Post>>>(`/users/${username}/posts${q}`);
};
export const getUserComments = (username: string, cursor?: string) => {
  const q = cursor ? `?cursor=${cursor}` : '';
  return request<ApiResponse<PaginatedResponse<Comment>>>(`/users/${username}/comments${q}`);
};
export const updateProfile = (body: { bio?: string; avatar_url?: string; notification_emails?: number }) =>
  request<ApiResponse<User>>('/users/me', { method: 'PATCH', body: JSON.stringify(body) });

export const uploadAvatar = async (file: File): Promise<User> => {
  const token = getToken();
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${BASE}/upload/avatar`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? 'Avatar upload failed');
  return json.data as User;
};

export const changePassword = (body: { old_password: string; new_password: string }) =>
  request<ApiResponse<null>>('/auth/change-password', { method: 'POST', body: JSON.stringify(body) });

export const updateNotificationSettings = (enabled: boolean) =>
  request<ApiResponse<User>>('/users/me', { method: 'PATCH', body: JSON.stringify({ notification_emails: enabled ? 1 : 0 }) });

export const resendVerification = () =>
  request<ApiResponse<{ message: string }>>('/auth/resend-verification', { method: 'POST' });

export const verifyEmail = (token: string) =>
  request<ApiResponse<{ message: string }>>('/auth/verify-email', {
    method: 'POST',
    body: JSON.stringify({ token }),
  });

// Search
export const search = (params: { q: string; community?: string; sort?: string; cursor?: string }) => {
  const q = new URLSearchParams(params as Record<string, string>).toString();
  return request<ApiResponse<PaginatedResponse<Post>>>(`/search?${q}`);
};

// Notifications
export const getNotifications = () =>
  request<ApiResponse<{ notifications: Notification[]; unread_count: number }>>('/notifications');
export const markAllNotificationsRead = () =>
  request<ApiResponse<null>>('/notifications/read-all', { method: 'POST' });
export const markNotificationRead = (id: string) =>
  request<ApiResponse<null>>(`/notifications/${id}/read`, { method: 'PATCH' });

// Moderation
export type PostReport = {
  id: string; reporter_id: string; target_id: string; target_type: 'post';
  reason: string; resolved: number; created_at: number;
  target_title: string; target_author_id: string; reporter_username: string;
};
export type CommentReport = {
  id: string; reporter_id: string; target_id: string; target_type: 'comment';
  reason: string; resolved: number; created_at: number;
  target_body: string; target_author_id: string; reporter_username: string;
};
export type AdminReport = {
  id: string; reporter_id: string; target_id: string; target_type: 'post' | 'comment';
  reason: string; resolved: number; created_at: number; reporter_username: string;
  target_author_id: string | null; target_preview: string | null;
};

export const getModQueue = (slug: string) =>
  request<ApiResponse<{ post_reports: PostReport[]; comment_reports: CommentReport[] }>>(
    `/mod/${slug}/queue`
  );

export const modRemovePost = (postId: string) =>
  request<ApiResponse<{ message: string }>>(`/mod/posts/${postId}/remove`, { method: 'POST' });

export const modPinPost = (postId: string) =>
  request<ApiResponse<{ is_pinned: number }>>(`/mod/posts/${postId}/pin`, { method: 'POST' });

export const modBanUserFromCommunity = (userId: string, communitySlug: string) =>
  request<ApiResponse<{ message: string }>>(`/mod/users/${userId}/ban`, {
    method: 'POST',
    body: JSON.stringify({ community_slug: communitySlug }),
  });

export const getAdminReports = (cursor?: string) => {
  const q = cursor ? `?cursor=${cursor}` : '';
  return request<ApiResponse<PaginatedResponse<AdminReport>>>(`/mod/admin/reports${q}`);
};

export const resolveReport = (reportId: string) =>
  request<ApiResponse<{ message: string }>>(`/mod/admin/reports/${reportId}/resolve`, { method: 'POST' });

export const globalBanUser = (userId: string) =>
  request<ApiResponse<{ message: string }>>(`/mod/admin/users/${userId}/ban`, { method: 'POST' });

// Upload
export const uploadImage = async (file: File): Promise<string> => {
  const token = getToken();
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${BASE}/upload/image`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? 'Upload failed');
  return json.data.url as string;
};
