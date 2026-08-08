import { EntitySheet } from "@/components/board/EntitySheet";

export default async function Page({
  params,
}: PageProps<"/board/e/[entityId]">) {
  const { entityId } = await params;
  return <EntitySheet entityId={entityId} />;
}
