"use client";

import dynamic from "next/dynamic";
import ErrorBoundary from "./ErrorBoundary";
import { Boxes, AlertTriangle } from "lucide-react";

const VectorSearch3D = dynamic(() => import("./VectorSearch3D"), {
  ssr: false,
  loading: () => (
    <section className="mx-auto max-w-6xl px-4 py-20">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Vector retrieval, accurately
        </h2>
      </div>
      <div className="card mt-10 grid h-[520px] place-items-center">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <Boxes className="animate-pulse" size={32} />
          <p className="text-sm">Loading 3D scene…</p>
        </div>
      </div>
    </section>
  ),
});

function WebGLFallback() {
  return (
    <section id="vector" className="mx-auto max-w-6xl px-4 py-20">
      <div className="mx-auto max-w-2xl text-center">
        <div className="eyebrow"><AlertTriangle size={12} className="text-alert" /> WebGL unavailable on this device</div>
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Vector retrieval, accurately
        </h2>
        <p className="mt-4 text-slate-600 dark:text-slate-300">
          Your browser couldn&apos;t initialize a WebGL context, so the interactive 3D
          point cloud is disabled. On a WebGL-capable device this section renders an
          orbitable embedding space with true nearest-neighbor retrieval.
        </p>
      </div>
    </section>
  );
}

export default function VectorSearchSection() {
  return (
    <ErrorBoundary fallback={<WebGLFallback />}>
      <VectorSearch3D />
    </ErrorBoundary>
  );
}
