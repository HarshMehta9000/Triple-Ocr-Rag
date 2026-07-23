"use client";

import {
  Boxes, Network, ScanSearch, MessageSquareText, Layers3,
} from "lucide-react";

const CHUNKING = [
  "Fixed-size token window",
  "Sentence-aware",
  "Recursive character",
  "Semantic (similarity thresholds)",
  "Layout / structure-aware (tables & forms)",
  "Parent-child / small-to-big",
  "Late chunking",
  "Agentic (LLM-decided boundaries)",
];

const EMBEDDING_FAMILIES = [
  { tag: "Dense", items: "BGE-M3 · E5-Mistral · NV-Embed-v2 · GTE · Cohere embed v3", color: "#4f46e5" },
  { tag: "Sparse", items: "BM25 · SPLADE · BGE-M3 sparse", color: "#3b82f6" },
  { tag: "Late-interaction", items: "ColBERT v2 · JaColBERT", color: "#0ea5e9" },
  { tag: "Multimodal", items: "CLIP · SigLIP · Jina-CLIP", color: "#06b6d4" },
];

const EMBEDDING_TECH = [
  "Matryoshka representation (truncate dimensions at query time)",
  "int8 / binary quantization (10 to 30x smaller index)",
  "Deduplication and content-addressed caching",
  "Domain-adaptive fine-tuning on your corpus",
];

const RETRIEVAL = [
  "Weighted-alpha fusion and Reciprocal Rank Fusion (RRF)",
  "ANN indexes: FAISS, HNSW (hnswlib), LanceDB, Qdrant, Milvus, Weaviate, pgvector, Chroma, Vespa",
  "Query expansion, HyDE, multi-query generation",
  "Cross-encoder rerank: BGE-reranker, Cohere Rerank",
];

const PROMPTING = [
  "Zero / few-shot",
  "Chain-of-thought",
  "Self-consistency",
  "ReAct",
  "Chain-of-Verification",
  "Step-back prompting",
  "Map-reduce / Refine / Stuff",
  "Citation-prompting (forced inline tags)",
  "Constrained decoding (outlines, lm-format-enforcer)",
  "Self-RAG / CRAG reflection",
];

function Chips({ items, mono = true }: { items: string[]; mono?: boolean }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((it) => (
        <span key={it} className={`tag ${mono ? "font-mono" : ""}`}>{it}</span>
      ))}
    </div>
  );
}

export default function RetrievalStack() {
  return (
    <section id="retrieval" className="mx-auto max-w-6xl px-4 py-20">
      <div className="mx-auto max-w-2xl text-center">
        <div className="eyebrow"><Network size={12} className="text-primary" /> The retrieval stack</div>
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Chunking, embeddings, retrieval, prompting</h2>
        <p className="mt-4 text-slate-600 dark:text-slate-300">
          Retrieval quality decides whether RAG is trustworthy. These are the techniques
          and frameworks a production system chooses from, and what this project exercises
          across its three pipelines.
        </p>
      </div>

      {/* chunking */}
      <div className="mt-14 grid gap-5 lg:grid-cols-2">
        <div className="card p-5">
          <div className="mb-3 flex items-center gap-2"><Boxes size={16} className="text-primary" /><h3 className="font-semibold">Chunking strategies</h3></div>
          <Chips items={CHUNKING} mono={false} />
          <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
            Frameworks: LangChain TextSplitter, LlamaIndex NodeParser, Unstructured, Marker, semantic-chunker.
          </p>
        </div>
        <div className="card p-5">
          <div className="mb-3 flex items-center gap-2"><MessageSquareText size={16} className="text-primary" /><h3 className="font-semibold">Prompting techniques</h3></div>
          <Chips items={PROMPTING} mono={false} />
          <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
            Paired with constrained decoding so the model always returns grounded, schema-valid answers with inline citations.
          </p>
        </div>
      </div>

      {/* embeddings */}
      <div className="mt-8 card p-5">
        <div className="mb-3 flex items-center gap-2"><Layers3 size={16} className="text-primary" /><h3 className="font-semibold">Embedding families</h3></div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {EMBEDDING_FAMILIES.map((f) => (
            <div key={f.tag} className="rounded-lg border border-slate-200 p-3 dark:border-white/10">
              <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide" style={{ color: f.color }}>
                <span className="h-2 w-2 rounded-full" style={{ background: f.color }} /> {f.tag}
              </p>
              <p className="mt-1.5 font-mono text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">{f.items}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-400">Cost levers</p>
        <ul className="mt-2 grid gap-1.5 sm:grid-cols-2">
          {EMBEDDING_TECH.map((t) => (
            <li key={t} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-accent" /> {t}
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
          Serving: sentence-transformers, FlagEmbedding, Text Embeddings Inference (TEI), Infinity, FastEmbed.
        </p>
      </div>

      {/* retrieval */}
      <div className="mt-8 card p-5">
        <div className="mb-3 flex items-center gap-2"><ScanSearch size={16} className="text-primary" /><h3 className="font-semibold">Retrieval &amp; reranking</h3></div>
        <ul className="space-y-2">
          {RETRIEVAL.map((r) => (
            <li key={r} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary" /> {r}
            </li>
          ))}
        </ul>
        <div className="mt-3 rounded-lg bg-slate-100 p-3 font-mono text-[11px] text-slate-600 dark:bg-white/5 dark:text-slate-300">
          fused = Σ 1 / (k + rank) &nbsp;·&nbsp; hybrid α blend &nbsp;·&nbsp; cross-encoder rerank
        </div>
      </div>
    </section>
  );
}
