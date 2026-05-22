import Image from 'next/image';

const sizeMap = { sm: 24, md: 32, lg: 48, xl: 80 };
const colors = ['bg-red-400','bg-orange-400','bg-yellow-400','bg-green-400','bg-blue-400','bg-purple-400','bg-pink-400'];

interface Props {
  username: string;
  avatarUrl?: string | null;
  size?: keyof typeof sizeMap;
}

export function UserAvatar({ username, avatarUrl, size = 'md' }: Props) {
  const px = sizeMap[size];
  const color = colors[username.charCodeAt(0) % colors.length];

  if (avatarUrl) {
    return (
      <Image
        src={avatarUrl}
        alt={username}
        width={px}
        height={px}
        className="rounded-full object-cover"
        style={{ width: px, height: px }}
      />
    );
  }

  return (
    <div
      className={`${color} rounded-full flex items-center justify-center text-white font-bold shrink-0`}
      style={{ width: px, height: px, fontSize: px * 0.4 }}
    >
      {username[0].toUpperCase()}
    </div>
  );
}
