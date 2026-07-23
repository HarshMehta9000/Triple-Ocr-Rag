"use client";

import { TrendingDown, Clock, Gauge, ShieldCheck, Sparkles, Users } from "lucide-react";

const METRICS = [
  { icon: TrendingDown, label: "Token input cost", value: "$2,390", was: "from $18,400 / mo", note: "87% lower on 1.2M queries", color: "#4f46e5" },
  { icon: Sparkles, label: "Prompt context", value: "1,840", was: "from 48,200 tok / query", note: "96% smaller", color: "#3b82f6" },
  { icon: Clock, label: "Review time", value: "7 min", was: "from 52 min / package", note: "per 250-page package", color: "#0ea5e9" },
  { icon: Users, label: "Analyst capacity", value: "4.8x", was: "throughput multiplier", note: "same headcount", color: "#06b6d4" },
  { icon: ShieldCheck, label: "Citation accuracy", value: "99.2%", was: "4,000 Q&A eval pairs", note: "hallucination 0.4% to 0.03%", color: "#0d9488" },
  { icon: Gauge, label: "Throughput", value: "340 q/s", was: "p50 740ms, p95 2.1s", note: "single node, 4x A100", color: "#d97706" },
];

const HOW_SAVE = [
  "Smaller chunks and rerank send far fewer tokens to the model.",
  "A semantic cache answers repeat and near-duplicate questions for free.",
  "Prompt compression (LLMLingua) trims context without losing meaning.",
  "Quantized embeddings shrink the index 10 to 30x with negligible recall loss.",
];

export default function Impact() {
  return (
    <section id="impact" className="mx-auto max-w-6xl px-4 py-20">
      <div className="mx-auto max-w-2xl text-center">
        <div className="eyebrow"><TrendingDown size={12} className="text-primary" /> Impact</div>
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Cheaper, faster, still accountable</h2>
        <p className="mt-4 text-slate-600 dark:text-slate-300">
          Illustrative numbers for a mid-volume production deployment. The pattern: cut
          token cost and review time, keep a human reviewer on everything that matters.
        </p>
      </div>

      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {METRICS.map((m) => (
          <div key={m.label} className="card p-5">
            <div className="flex items-center justify-between">
              <div className="grid h-10 w-10 place-items-center rounded-lg" style={{ background: `${m.color}1a`, color: m.color }}>
                <m.icon size={18} />
              </div>
              <span className="font-mono text-[10px] text-slate-400">{m.was}</span>
            </div>
            <p className="mt-3 font-mono text-2xl font-bold text-slate-900 dark:text-white">{m.value}</p>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{m.label}</p>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{m.note}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <div className="card p-5">
          <h3 className="font-semibold">How token cost comes down</h3>
          <ul className="mt-3 space-y-2">
            {HOW_SAVE.map((h) => (
              <li key={h} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary" /> {h}
              </li>
            ))}
          </ul>
        </div>
        <div className="card p-5">
          <h3 className="font-semibold">Human stays in the loop</h3>
          <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            Every answer below confidence 0.7, every cross-source conflict, and every
            sensitive request is routed to a reviewer queue with full source
            traceability. Reviewers see the exact passages and the model&apos;s reasoning,
            approve or edit, and the decision feeds back into the eval set.
          </p>
          <div className="mt-4 grid grid-cols-3 gap-3 text-center">
            <Mini k="0.7" v="confidence floor" />
            <Mini k="100%" v="auditable" />
            <Mini k="4.8x" v="reviewer capacity" />
          </div>
        </div>
      </div>
    </section>
  );
}

function Mini({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white/50 p-3 dark:border-white/10 dark:bg-white/[0.02]">
      <p className="font-mono text-lg font-bold text-slate-900 dark:text-white">{k}</p>
      <p className="text-[11px] text-slate-500 dark:text-slate-400">{v}</p>
    </div>
  );
}
