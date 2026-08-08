import { Suspense } from "react";
import { EntitySheet } from "@/components/board/EntitySheet";

export default function Page() {
  return (
    <Suspense fallback={<div className="h-full" />}>
      <EntitySheet />
    </Suspense>
  );
}
