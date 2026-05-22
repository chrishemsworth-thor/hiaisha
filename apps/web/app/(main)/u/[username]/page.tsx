import { notFound } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { PostFeed } from '@/components/posts/PostFeed';
import { getUser, getUserPosts } from '@/lib/api';

export default async function UserPage({ params }: { params: { username: string } }) {
  let user, posts;
  try {
    const [userRes, postsRes] = await Promise.all([getUser(params.username), getUserPosts(params.username)]);
    user = userRes.data;
    posts = postsRes.data?.data ?? [];
  } catch {
    notFound();
  }
  if (!user) notFound();

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-card border border-gray-200 p-6 mb-6 flex items-start gap-4">
        <UserAvatar username={user.username} avatarUrl={user.avatar_url} size="xl" />
        <div>
          <h1 className="font-display font-bold text-2xl">{user.username}</h1>
          {user.bio && <p className="text-sm text-muted mt-1">{user.bio}</p>}
          <div className="flex gap-4 mt-3 text-sm">
            <div><span className="font-semibold">{user.karma.toLocaleString()}</span> <span className="text-muted">karma</span></div>
            <div className="text-muted">Joined {formatDistanceToNow(new Date(user.created_at * 1000), { addSuffix: true })}</div>
          </div>
        </div>
      </div>
      <h2 className="font-semibold mb-3">Posts</h2>
      <PostFeed posts={posts} />
    </div>
  );
}
