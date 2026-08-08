import { Suspense } from "react";
import { FlowCanvas } from "@/components/flow/FlowCanvas";

export default function Page() {
  return (
    <Suspense fallback={<div className="h-full" />}>
      <FlowCanvas />
    </Suspense>
  );
}
