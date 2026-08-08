import { Suspense } from "react";
import { CreateEntity } from "@/components/board/CreateEntity";

export default function Page() {
  return (
    <Suspense fallback={<div className="h-full" />}>
      <CreateEntity />
    </Suspense>
  );
}
