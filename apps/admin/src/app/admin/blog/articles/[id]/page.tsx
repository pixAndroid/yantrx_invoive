import { redirect } from 'next/navigation';

interface Props {
  params: { id: string };
}

export default function ArticleDetailPage({ params }: Props) {
  redirect(`/admin/blog/articles/${params.id}/edit`);
}
