import { Suspense } from "react";
import { GameStudio } from "@/components/game/GameStudio";

export default function Page() {
  return (
    <Suspense fallback={<div className="h-full" />}>
      <GameStudio />
    </Suspense>
  );
}
