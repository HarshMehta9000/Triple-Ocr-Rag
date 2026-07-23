"use client";

import { AlertTriangle, Boxes, Brain, ScanSearch, Network } from "lucide-react";

const STAGES = [
  {
    icon: Boxes,
    stage: "Chunking",
    color: "#4338ca",
    failures: [
      { t: "Severed boundaries", d: "Fixed-size splits cut mid-sentence or mid-clause, orphaning a fact from its context." },
      { t: "Size trade-off", d: "Too small loses surrounding meaning; too large dilutes relevance and burns the context window." },
      { t: "Structure loss", d: "Tables, lists and forms get flattened and scattered across chunks; fee tables and EOBs suffer most." },
      { t: "Overlap drift", d: "Too little overlap breaks continuity; too much multiplies cost and duplicate retrievals." },
    ],
  },
  {
    icon: Network,
    stage: "Embedding",
    color: "#3b82f6",
    failures: [
      { t: "Domain mismatch", d: "Generic embeddings underperform on clinical, legal and financial vocabulary; synonyms outrank exact codes." },
      { t: "Rare-term blindness", d: "ICD codes, ISINs, policy numbers and proper nouns map to weak, generic vectors." },
      { t: "Multilingual drift", d: "Cross-lingual spaces are noisier; mixed-language docs retrieve inconsistently." },
      { t: "Quantization error", d: "Compressed vectors + ANN approximation compound, returning near-but-wrong neighbors." },
    ],
  },
  {
    icon: ScanSearch,
    stage: "Retrieval",
    color: "#0ea5e9",
    failures: [
      { t: "Vocabulary mismatch", d: "Sparse misses paraphrase; dense misses exact keywords. Get the hybrid α wrong and both suffer." },
      { t: "Low recall", d: "ANN ef_search / nprobe too small, or top-k too tight, and the right passage never enters context." },
      { t: "No rerank", d: "First-pass scores aren't precision-ordered; relevant chunks sit below noise without a cross-encoder." },
      { t: "Lost in the middle", d: "Even when retrieved, evidence buried mid-context is attended to poorly by the model." },
    ],
  },
  {
    icon: Brain,
    stage: "Generation",
    color: "#0d9488",
    failures: [
      { t: "Hallucination", d: "The model generates plausible text beyond, or contrary to, the retrieved evidence." },
      { t: "Unfaithful synthesis", d: "Numbers, dates and names get transposed or conflated across sources." },
      { t: "Conflicting context", d: "Two passages disagree and the model silently picks one, or blends them into a wrong answer." },
      { t: "Citation failure", d: "Claims go un-cited, or are tagged with the wrong source, defeating verifiability." },
    ],
  },
];

export default function FailureModes() {
  return (
    <section id="failures" className="border-y border-slate-200/60 bg-white/40 py-20 dark:border-white/10 dark:bg-white/[0.015]">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mx-auto max-w-2xl text-center">
          <div className="eyebrow"><AlertTriangle size={12} className="text-alert" /> Where it breaks</div>
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Where RAG fails</h2>
          <p className="mt-4 text-slate-600 dark:text-slate-300">
            RAG quality is the product of four stages. Each has characteristic failure
            modes, and each is exactly what an evaluation should measure and a guardrail
            should catch.
          </p>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {STAGES.map((s) => (
            <div key={s.stage} className="card flex flex-col p-5">
              <div className="mb-4 flex items-center gap-3">
                <div className="grid h-9 w-9 place-items-center rounded-lg" style={{ background: `${s.color}1a`, color: s.color }}>
                  <s.icon size={18} />
                </div>
                <h3 className="font-semibold">{s.stage}</h3>
              </div>
              <ul className="space-y-3">
                {s.failures.map((f) => (
                  <li key={f.t}>
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{f.t}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-slate-600 dark:text-slate-400">{f.d}</p>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <p className="mx-auto mt-10 max-w-3xl text-center text-sm text-slate-500 dark:text-slate-400">
          The next two disciplines close the loop: <b className="text-slate-700 dark:text-slate-200">evaluation</b>{" "}
          quantifies these failures continuously, and <b className="text-slate-700 dark:text-slate-200">guardrails</b>{" "}
          prevent them from reaching the user.
        </p>
      </div>
    </section>
  );
}
