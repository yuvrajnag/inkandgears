import { CollectionView } from "@/components/board/CollectionView";

export default async function Page({
  params,
}: PageProps<"/board/c/[boardId]">) {
  const { boardId } = await params;
  return <CollectionView boardId={boardId} />;
}
