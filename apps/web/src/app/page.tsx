"use client";

import { Canvas } from "@/components/canvas";
import { Suspense } from "react";

export default function Home() {
  return (
    <Suspense>
      <Canvas />
    </Suspense>
  );
}
