import ArticleEditor from '../../_components/ArticleEditor';

interface Props {
  params: { id: string };
}

export default function EditArticlePage({ params }: Props) {
  return <ArticleEditor postId={params.id} />;
}
