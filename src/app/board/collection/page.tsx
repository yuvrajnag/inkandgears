import { Suspense } from "react";
import { CollectionView } from "@/components/board/CollectionView";

export default function Page() {
  return (
    <Suspense fallback={<div className="h-full" />}>
      <CollectionView />
    </Suspense>
  );
}
