"use client";

import { ClipboardCheck, Gauge } from "lucide-react";

const RETRIEVAL_METRICS = [
  { name: "Recall@k", formula: "relevant retrieved / total relevant", note: "Did the right passage make it into context?" },
  { name: "Precision@k", formula: "relevant retrieved / k", note: "How much of the context is actually useful?" },
  { name: "MRR", formula: "mean of 1 / rank of first hit", note: "How high does the first relevant chunk rank?" },
  { name: "NDCG", formula: "DCG / iDCG, graded relevance", note: "Are the most relevant chunks ranked first?" },
];

const GENERATION_METRICS = [
  { name: "Faithfulness", formula: "grounded claims / total claims", note: "The core anti-hallucination metric." },
  { name: "Context precision", formula: "relevant chunks / retrieved chunks", note: "Catches noise diluting the prompt." },
  { name: "Context recall", formula: "answer covered by context", note: "Did retrieval supply what was needed?" },
  { name: "Answer relevancy", formula: "LLM-judge vs. query intent", note: "Does it actually answer the question?" },
];

const FRAMEWORKS = ["RAGAS", "TruLens", "DeepEval", "Arize Phoenix", "LangSmith", "promptfoo"];

function MetricCard({ m, accent }: { m: { name: string; formula: string; note: string }; accent: string }) {
  return (
    <div className="card p-4">
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full" style={{ background: accent }} />
        <p className="text-sm font-medium">{m.name}</p>
      </div>
      <p className="mt-2 font-mono text-xs text-slate-500 dark:text-slate-400">{m.formula}</p>
      <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-400">{m.note}</p>
    </div>
  );
}

export default function EvalsGuardrails() {
  return (
    <section id="evals" className="mx-auto max-w-6xl px-4 py-20">
      <div className="mx-auto max-w-2xl text-center">
        <div className="eyebrow"><Gauge size={12} className="text-primary" /> Evals</div>
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Measure it before you trust it</h2>
        <p className="mt-4 text-slate-600 dark:text-slate-300">
          Retrieval and generation are measured independently, then end to end. A golden
          set per domain (claims, policies, filings) runs on every change, with
          LLM-as-judge plus human spot-checks.
        </p>
      </div>

      <div className="mt-12 grid gap-4 lg:grid-cols-2">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Retrieval metrics</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {RETRIEVAL_METRICS.map((m) => <MetricCard key={m.name} m={m} accent="#4f46e5" />)}
          </div>
        </div>
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Generation metrics</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {GENERATION_METRICS.map((m) => <MetricCard key={m.name} m={m} accent="#0ea5e9" />)}
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <ClipboardCheck size={14} className="text-slate-400" />
        <span className="text-xs text-slate-400">Frameworks:</span>
        {FRAMEWORKS.map((f) => <span key={f} className="tag font-mono">{f}</span>)}
      </div>
    </section>
  );
}
