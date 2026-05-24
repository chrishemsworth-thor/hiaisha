import type { Metadata } from 'next';
import { getPost } from '@/lib/api';
import PostPageClient from './PostPageClient';

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  try {
    const res = await getPost(params.id);
    const post = res.data;
    if (!post) return {};

    const title = post.title;
    const description = post.body
      ? post.body.slice(0, 155).replace(/\n/g, ' ') + (post.body.length > 155 ? '…' : '')
      : `Check out this post on Hiaisha — the Malaysian food community.`;

    // Prefer first attached image, fall back to default OG image
    const firstImage =
      post.images && post.images.length > 0 ? post.images[0] : '/og-default.png';

    const communitySlug = post.community?.slug;
    const canonicalUrl = `https://hiaisha.com/post/${params.id}`;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        url: canonicalUrl,
        siteName: 'Hiaisha',
        type: 'article',
        ...(communitySlug
          ? { section: communitySlug }
          : {}),
        images: [
          {
            url: firstImage,
            width: 1200,
            height: 630,
            alt: title,
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [firstImage],
      },
    };
  } catch {
    return {};
  }
}

export default function PostPage({ params }: { params: { id: string } }) {
  return <PostPageClient params={params} />;
}
