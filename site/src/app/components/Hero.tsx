"use client";

import { ArrowRight, FileSearch, ScanText, Server, ShieldCheck } from "lucide-react";
import PipelineAnimation from "./PipelineAnimation";

export default function Hero() {
  return (
    <section id="top" className="relative overflow-hidden">
      <div className="bg-aurora animate-gradient-pan absolute inset-0 -z-10" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-transparent to-slate-50 dark:to-[#0b0d12]" />
      <div className="mx-auto max-w-6xl px-4 pb-12 pt-20 sm:pt-28">
        <div className="mx-auto max-w-3xl text-center">
          <div className="eyebrow">
            <Layers3 /> Multimodal · self-hostable · human-in-the-loop
          </div>
          <h1 className="text-balance text-4xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
            Production RAG for{" "}
            <span className="text-gradient">high-stakes document intelligence</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-pretty text-base text-slate-600 dark:text-slate-300 sm:text-lg">
            Three retrieval models, one grounded pipeline. Mortgages, claims, policies,
            filings, and long-form text. Runs on your own GPUs, stays inside your
            network, masks PII before anything reaches a model, and keeps a human
            reviewer in the loop.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <a href="#pipeline" className="btn-primary">Run the pipeline <ArrowRight size={16} /></a>
            <a href="#chatbot" className="btn-ghost"><FileSearch size={16} /> Talk to the chatbot</a>
          </div>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="inline-flex items-center gap-1.5"><ScanText size={13} className="text-primary" /> PDF · image · text</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-accent" /> Hybrid retrieval (BM25 + dense)</span>
            <span className="inline-flex items-center gap-1.5"><Server size={13} className="text-primary" /> On-prem GPU</span>
            <span className="inline-flex items-center gap-1.5"><ShieldCheck size={13} className="text-alert" /> PII-masked &amp; guardrailed</span>
          </div>
        </div>
        <div className="mx-auto mt-14 max-w-5xl" id="pipeline">
          <PipelineAnimation />
        </div>
      </div>
    </section>
  );
}

function Layers3() {
  return <span className="h-1.5 w-1.5 rounded-full bg-primary inline-block" />;
}
