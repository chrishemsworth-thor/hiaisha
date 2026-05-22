import { redirect } from 'next/navigation';

export default function CommunitySubmitPage({ params }: { params: { slug: string } }) {
  redirect(`/submit?community=${params.slug}`);
}
