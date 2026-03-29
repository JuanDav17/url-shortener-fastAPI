import { notFound, redirect } from 'next/navigation';
import { getUrl } from '@/lib/store';

interface RedirectPageProps {
  params: Promise<{ slug: string }>;
}

export default async function RedirectPage({ params }: RedirectPageProps) {
  const { slug } = await params;
  const originalUrl = await getUrl(slug);

  if (!originalUrl) {
    notFound();
  }

  redirect(originalUrl);
}
