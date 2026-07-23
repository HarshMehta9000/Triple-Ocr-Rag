"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  FileText, ImageIcon, Type, ScanText, Network, ScanSearch, Sparkles,
  Play, Pause, RotateCcw, Lock, ShieldCheck, ShieldAlert, KeyRound, EyeOff, CheckCircle2,
} from "lucide-react";

// 9 stages; two amber guardrails gate the entry and exit of the model boundary.
const STAGES = [
  { key: "ingest", label: "Ingest", sub: "multimodal source", accent: "#4f46e5" },
  { key: "extract", label: "Extract", sub: "parse / OCR", accent: "#4f46e5" },
  { key: "redact", label: "Redact", sub: "PII · secrets · vault", accent: "#d97706" },
  { key: "chunk", label: "Chunk", sub: "semantic", accent: "#4f46e5" },
  { key: "embed", label: "Embed", sub: "sparse + dense", accent: "#0ea5e9" },
  { key: "retrieve", label: "Retrieve", sub: "hybrid search", accent: "#0ea5e9" },
  { key: "rerank", label: "Rerank", sub: "cross-encoder", accent: "#0ea5e9" },
  { key: "generate", label: "Generate", sub: "de-identified", accent: "#4f46e5" },
  { key: "guard", label: "Guard", sub: "leak scan · cited", accent: "#d97706" },
] as const;

const DOC = {
  source: "EOB · Claim #4471",
  // raw extracted lines (some carry PHI)
  lines: [
    "Patient: J. Rivera",
    "DOB: 1979-04-12",
    "MRN: 4471-22-8890",
    "CPT 99213, office visit",
    "Billed: $240.00",
    "Applied to deductible: $240.00",
    "Patient responsibility: $0.00",
  ],
  // what the model is allowed to see (de-identified); vault holds the mapping
  redactions: [
    { raw: "Patient: J. Rivera", masked: "Patient: [NAME]", tag: "NAME" },
    { raw: "DOB: 1979-04-12", masked: "DOB: [DOB]", tag: "DOB" },
    { raw: "MRN: 4471-22-8890", masked: "MRN: [MRN]", tag: "MRN" },
  ],
  // chunks built from de-identified text
  chunks: [
    "Patient [NAME], CPT 99213 office visit.",
    "Billed $240.00, applied to deductible.",
    "Deductible met; patient owes $0.00.",
    "In-network provider, no prior auth.",
  ],
  query: "How much does the patient owe?",
  answer: [
    { text: "The patient owes " },
    { text: "$0.00", cite: 3, strong: true },
    { text: "; the $240 charge was applied to the deductible " },
    { text: "", cite: 2 },
    { text: "." },
  ],
};

const SCORES = [
  { sparse: 0.12, dense: 0.41, rerank: 0.38 },
  { sparse: 0.88, dense: 0.79, rerank: 0.86 },
  { sparse: 0.95, dense: 0.93, rerank: 0.97 },
  { sparse: 0.30, dense: 0.22, rerank: 0.19 },
];

const STEP_MS = 2400;

// Live metrics that unlock as the document advances through the pipeline.
const METRICS = [
  { key: "pii", unlock: 2, label: "PII fields masked", value: "1,204", sub: "3 secrets scrubbed" },
  { key: "tokens", unlock: 4, label: "Context tokens sent", value: "1,840", sub: "vs 48,200 naive (96% smaller)" },
  { key: "cost", unlock: 7, label: "Input cost / query", value: "$0.03", sub: "vs $0.41 (93% lower)" },
  { key: "time", unlock: 8, label: "Analyst review time", value: "7 min", sub: "vs 52 min / package" },
] as const;

export default function PipelineAnimation() {
  const [stage, setStage] = useState(0);
  const [playing, setPlaying] = useState(true);

  useEffect(() => {
    if (!playing) return;
    const t = setTimeout(() => setStage((s) => (s + 1) % STAGES.length), STEP_MS);
    return () => clearTimeout(t);
  }, [stage, playing]);

  const accent = STAGES[stage].accent;
  const progress = (stage / (STAGES.length - 1)) * 100;

  return (
    <div className="card overflow-hidden p-5 sm:p-6">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">Live pipeline: a 250-page loan package, end to end</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Watch one package flow from ingest to cited answer. Counters below show the cost and time it saves.
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setPlaying((p) => !p)}
            className="grid h-8 w-8 place-items-center rounded-lg border border-slate-300 text-slate-600 transition hover:bg-slate-50 dark:border-white/15 dark:text-slate-300 dark:hover:bg-white/5"
            aria-label={playing ? "Pause" : "Play"}
          >
            {playing ? <Pause size={14} /> : <Play size={14} />}
          </button>
          <button
            onClick={() => { setStage(0); setPlaying(true); }}
            className="grid h-8 w-8 place-items-center rounded-lg border border-slate-300 text-slate-600 transition hover:bg-slate-50 dark:border-white/15 dark:text-slate-300 dark:hover:bg-white/5"
            aria-label="Restart"
          >
            <RotateCcw size={14} />
          </button>
        </div>
      </div>

      {/* stage rail */}
      <div className="relative mb-2 h-1.5 w-full rounded-full bg-slate-200 dark:bg-white/10">
        <motion.div
          className="absolute left-0 top-0 h-full rounded-full"
          style={{ background: "linear-gradient(90deg, #4f46e5, #0ea5e9 55%, #4f46e5 75%, #d97706)" }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow"
          animate={{ left: `${progress}%`, boxShadow: `0 0 0 2px ${accent}, 0 0 14px ${accent}aa` }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
        />
      </div>
      <div className="mb-5 flex justify-between">
        {STAGES.map((s, i) => (
          <button
            key={s.key}
            onClick={() => setStage(i)}
            className="group flex flex-1 flex-col items-center gap-1 text-center"
          >
            <span className={`text-[9px] font-medium transition sm:text-[11px] ${i === stage ? "text-slate-900 dark:text-white" : "text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300"}`}>
              {s.label}
            </span>
          </button>
        ))}
      </div>

      <div className="mb-3 flex items-center justify-between">
        <span className="inline-flex items-center gap-2 text-xs font-medium" style={{ color: accent }}>
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: accent }} />
          {STAGES[stage].label}: {STAGES[stage].sub}
        </span>
        <span className="font-mono text-[11px] text-slate-400">
          {String(stage + 1).padStart(2, "0")} / {String(STAGES.length).padStart(2, "0")}
        </span>
      </div>

      {/* live metrics strip */}
      <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {METRICS.map((m) => {
          const reached = stage >= m.unlock;
          return (
            <motion.div
              key={m.key}
              animate={{ opacity: reached ? 1 : 0.4 }}
              transition={{ duration: 0.4 }}
              className="rounded-lg border border-slate-200 bg-white/60 px-3 py-2 dark:border-white/10 dark:bg-white/[0.02]"
            >
              <p className="text-[10px] uppercase tracking-wide text-slate-400">{m.label}</p>
              <p className={`mt-0.5 font-mono text-base font-semibold ${reached ? "text-slate-900 dark:text-white" : "text-slate-300 dark:text-slate-600"}`}>
                {reached ? m.value : "·"}
              </p>
              <p className="text-[10px] text-slate-400">{m.sub}</p>
            </motion.div>
          );
        })}
      </div>

      <div className="relative h-[300px] overflow-hidden rounded-xl border border-slate-200 bg-slate-50/60 p-4 dark:border-white/10 dark:bg-white/[0.02] sm:h-[280px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={STAGES[stage].key}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.35 }}
            className="h-full"
          >
            <StageView stage={stage} />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

function StageView({ stage }: { stage: number }) {
  switch (STAGES[stage].key) {
    case "ingest": return <IngestView />;
    case "extract": return <ExtractView />;
    case "redact": return <RedactView />;
    case "chunk": return <ChunkView />;
    case "embed": return <EmbedView />;
    case "retrieve": return <RetrieveView />;
    case "rerank": return <RerankView />;
    case "generate": return <GenerateView />;
    case "guard": return <GuardView />;
    default: return null;
  }
}

/* ---------- trust boundary wrapper ---------- */
function Vault({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative rounded-xl border border-dashed border-alert/50 bg-alert/5 p-3">
      <span className="absolute -top-2 left-3 inline-flex items-center gap-1 bg-slate-50 px-1.5 text-[10px] font-semibold uppercase tracking-wider text-alert dark:bg-[#0b0d12]">
        <Lock size={10} /> your VPC · on-prem
      </span>
      {children}
    </div>
  );
}

/* ---------- 1 · Ingest ---------- */
function IngestView() {
  const items = [
    { icon: FileText, label: "PDF" },
    { icon: ImageIcon, label: "Image" },
    { icon: Type, label: "Text" },
  ];
  return (
    <div className="flex h-full flex-col justify-center gap-3">
      <Vault>
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            {items.map((it, i) => (
              <motion.div
                key={it.label}
                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
              >
                <it.icon size={13} className="text-primary" /> {it.label}
              </motion.div>
            ))}
          </div>
          <span className="font-mono text-[10px] text-slate-400">{DOC.source}</span>
        </div>
        <div className="mt-2 space-y-1.5">
          {[50, 80, 60].map((w, i) => (
            <motion.div key={i} className="h-2 rounded-full bg-slate-200 dark:bg-white/10"
              initial={{ width: 0 }} animate={{ width: `${w}%` }} transition={{ delay: 0.3 + i * 0.1 }} />
          ))}
        </div>
      </Vault>
      <p className="text-xs text-slate-500 dark:text-slate-400">
        Any modality enters, but raw PHI never leaves the trust boundary.
      </p>
    </div>
  );
}

/* ---------- 2 · Extract ---------- */
function ExtractView() {
  return (
    <div className="flex h-full flex-col justify-center gap-3">
      <div className="inline-flex w-fit items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary">
        <ScanText size={12} /> parse · OCR · vision
      </div>
      <div className="max-w-lg space-y-1">
        {DOC.lines.map((line, i) => {
          const sensitive = /Rivera|1979-04-12|4471-22-8890/.test(line);
          return (
            <motion.div key={i}
              initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.12 }}
              className={`flex items-center gap-2 text-sm ${sensitive ? "text-alert" : "text-slate-700 dark:text-slate-200"}`}>
              <span className={`h-1 w-1 rounded-full ${sensitive ? "bg-alert" : "bg-primary/60"}`} />
              {line}
              {sensitive && <EyeOff size={11} className="text-alert" />}
            </motion.div>
          );
        })}
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400">
        Raw text includes identifiers (highlighted), flagged for redaction next.
      </p>
    </div>
  );
}

/* ---------- 3 · Redact (input guardrail) ---------- */
function RedactView() {
  return (
    <div className="flex h-full flex-col justify-center gap-3">
      <div className="inline-flex w-fit items-center gap-1.5 rounded-full bg-alert/10 px-2.5 py-1 text-[11px] font-medium text-alert">
        <ShieldCheck size={12} /> input guardrail · mask before model
      </div>
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <div className="space-y-1">
          <p className="mb-1 font-mono text-[10px] uppercase text-slate-400">raw</p>
          {DOC.redactions.map((r, i) => (
            <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.12 }}
              className="rounded bg-alert/10 px-1.5 py-0.5 font-mono text-[10px] text-alert line-through">
              {r.raw}
            </motion.div>
          ))}
        </div>
        <div className="flex flex-col items-center text-slate-400">
          <KeyRound size={14} className="text-alert" />
          <span className="mt-1 text-[9px] leading-tight">vault<br />tokenize</span>
        </div>
        <div className="space-y-1">
          <p className="mb-1 font-mono text-[10px] uppercase text-slate-400">de-identified</p>
          {DOC.redactions.map((r, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: 6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.12 + 0.1 }}
              className="rounded bg-emerald-500/10 px-1.5 py-0.5 font-mono text-[10px] text-emerald-700 dark:text-emerald-400">
              {r.masked}
            </motion.div>
          ))}
        </div>
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400">
        3 identifiers tokenized · secrets scrubbed · mapping kept in your vault, never sent to the model.
      </p>
    </div>
  );
}

/* ---------- 4 · Chunk ---------- */
function ChunkView() {
  return (
    <div className="flex h-full flex-col justify-center gap-3">
      <div className="flex flex-wrap gap-2">
        {DOC.chunks.map((c, i) => (
          <motion.div key={i}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.14 }}
            className="relative w-[47%] rounded-lg border border-slate-200 bg-white p-2.5 text-[11px] leading-snug text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
            <span className="mb-1 block font-mono text-[10px] text-slate-400">chunk {i + 1}</span>
            {c}
          </motion.div>
        ))}
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400">
        De-identified text is chunked with overlap; identifiers stay masked throughout.
      </p>
    </div>
  );
}

/* ---------- 5 · Embed ---------- */
function Vector({ type, values, delay }: { type: "sparse" | "dense"; values: number[]; delay: number }) {
  return (
    <div>
      <p className="mb-1 font-mono text-[10px] uppercase tracking-wide text-slate-400">
        {type === "sparse" ? "sparse · bm25" : "dense · embedding"}
      </p>
      <div className="flex h-12 items-end gap-0.5">
        {values.map((v, i) => (
          <motion.div key={i}
            className={type === "sparse" ? "w-1.5 rounded-sm bg-primary" : "w-1 rounded-sm bg-accent"}
            initial={{ height: 0 }} animate={{ height: `${v * 100}%` }} transition={{ delay: delay + i * 0.02, duration: 0.4 }} />
        ))}
      </div>
    </div>
  );
}
function EmbedView() {
  const sparse = useMemo(() => Array.from({ length: 24 }, (_, i) => (i % 7 === 0 ? 0.6 + (i % 3) * 0.15 : 0.04)), []);
  const dense = useMemo(() => Array.from({ length: 24 }, (_, i) => 0.25 + Math.abs(Math.sin(i * 0.9)) * 0.6), []);
  return (
    <div className="flex h-full flex-col justify-center gap-4">
      <div className="inline-flex w-fit items-center gap-1.5 rounded-full bg-accent/10 px-2.5 py-1 text-[11px] font-medium text-accent">
        <Network size={12} /> two embedding families
      </div>
      <div className="grid grid-cols-2 gap-6">
        <Vector type="sparse" values={sparse} delay={0.1} />
        <Vector type="dense" values={dense} delay={0.25} />
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400">
        Each masked chunk becomes sparse + dense vectors for hybrid search.
      </p>
    </div>
  );
}

/* ---------- 6 · Retrieve ---------- */
function Bar({ label, value, color, delay, active }: { label: string; value: number; color: string; delay: number; active?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-14 shrink-0 font-mono text-[10px] text-slate-400">{label}</span>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
        <motion.div className="h-full rounded-full" style={{ background: color }}
          initial={{ width: 0 }} animate={{ width: `${value * 100}%` }} transition={{ delay, duration: 0.5 }} />
      </div>
      {active && <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: delay + 0.3 }} className="text-[10px] font-medium text-alert">★</motion.span>}
    </div>
  );
}
function RetrieveView() {
  const fused = SCORES.map((s) => 0.4 * s.sparse + 0.6 * s.dense);
  const top = fused.map((v, i) => ({ i, v })).sort((a, b) => b.v - a.v).slice(0, 2).map((x) => x.i);
  return (
    <div className="flex h-full flex-col justify-center gap-2">
      <div className="flex items-center justify-between">
        <div className="rounded-lg bg-white px-3 py-1 text-xs font-medium text-slate-700 shadow-sm dark:bg-white/5 dark:text-slate-200">
          <span className="text-slate-400">query:</span> “{DOC.query}”
        </div>
        <code className="rounded bg-slate-100 px-2 py-1 text-[10px] text-slate-500 dark:bg-white/10 dark:text-slate-400">fused = α·sparse + (1−α)·dense</code>
      </div>
      <div className="space-y-1.5">
        {DOC.chunks.map((c, i) => {
          const hit = top.includes(i);
          return (
            <motion.div key={i}
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
              className={`rounded-lg border p-2 ${hit ? "border-alert/40 bg-alert/5" : "border-slate-200 bg-white/60 dark:border-white/10 dark:bg-white/[0.02]"}`}>
              <div className="mb-1 truncate text-[10px] text-slate-500 dark:text-slate-400">{c}</div>
              <Bar label="sparse" value={SCORES[i].sparse} color="#4f46e5" delay={0.15 + i * 0.06} />
              <Bar label="dense" value={SCORES[i].dense} color="#0ea5e9" delay={0.22 + i * 0.06} />
              <Bar label="fused" value={fused[i]} color={hit ? "#d97706" : "#94a3b8"} delay={0.3 + i * 0.06} active={hit} />
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- 7 · Rerank ---------- */
function RerankView() {
  const order = SCORES.map((s, i) => ({ i, r: s.rerank })).sort((a, b) => b.r - a.r);
  return (
    <div className="flex h-full flex-col justify-center gap-3">
      <div className="inline-flex w-fit items-center gap-1.5 rounded-full bg-accent/10 px-2.5 py-1 text-[11px] font-medium text-accent">
        <ScanSearch size={12} /> cross-encoder re-orders top-k by precision
      </div>
      <div className="space-y-2">
        {order.map((o, rank) => (
          <motion.div key={o.i} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 26 }}
            className={`flex items-center gap-3 rounded-lg border p-2.5 ${rank === 0 ? "border-alert/40 bg-alert/5" : "border-slate-200 bg-white/60 dark:border-white/10 dark:bg-white/[0.02]"}`}>
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-slate-100 font-mono text-[11px] font-semibold text-slate-500 dark:bg-white/10 dark:text-slate-300">{rank + 1}</span>
            <span className="flex-1 truncate text-[11px] text-slate-600 dark:text-slate-300">{DOC.chunks[o.i]}</span>
            <div className="flex w-20 items-center gap-1">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
                <motion.div className="h-full rounded-full bg-accent" initial={{ width: 0 }} animate={{ width: `${o.r * 100}%` }} transition={{ delay: 0.15 + rank * 0.1 }} />
              </div>
              <span className="font-mono text-[10px] text-slate-400">{o.r.toFixed(2)}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/* ---------- 8 · Generate ---------- */
function GenerateView() {
  return (
    <div className="flex h-full flex-col justify-center gap-3">
      <div className="inline-flex w-fit items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary">
        <Sparkles size={12} /> grounded · de-identified context only
      </div>
      <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-white/5">
        <p className="mb-1 font-mono text-[11px] text-slate-400">{DOC.query}</p>
        <p className="text-sm leading-relaxed text-slate-800 dark:text-slate-100">
          {DOC.answer.map((part, i) => (
            <motion.span key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.25 }}
              className={part.strong ? "font-semibold text-alert" : ""}>
              {part.text}
              {part.cite && (
                <motion.sup initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: i * 0.25 + 0.2 }}
                  className="ml-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded bg-primary px-1 align-middle text-[9px] font-bold text-white">
                  {part.cite}
                </motion.sup>
              )}
            </motion.span>
          ))}
        </p>
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400">
        The model answers from masked evidence; then the output passes a final guardrail.
      </p>
    </div>
  );
}

/* ---------- 9 · Guard (output guardrail) ---------- */
function GuardView() {
  const checks = [
    { t: "No PII / PHI leaked", ok: true },
    { t: "No secret or key exposed", ok: true },
    { t: "Cited & grounded in sources", ok: true },
    { t: "Sensitive requests refused", ok: true },
  ];
  return (
    <div className="flex h-full flex-col justify-center gap-3">
      <div className="inline-flex w-fit items-center gap-1.5 rounded-full bg-alert/10 px-2.5 py-1 text-[11px] font-medium text-alert">
        <ShieldAlert size={12} /> output guardrail · scan before delivery
      </div>
      <div className="grid grid-cols-2 gap-2">
        {checks.map((c, i) => (
          <motion.div key={c.t}
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.14 }}
            className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-2.5 py-2 text-[11px] text-slate-700 dark:text-slate-200">
            <CheckCircle2 size={14} className="shrink-0 text-emerald-600 dark:text-emerald-400" />
            {c.t}
          </motion.div>
        ))}
      </div>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
        className="rounded-lg border border-alert/30 bg-alert/5 p-2.5 text-[11px] text-slate-600 dark:text-slate-300">
        <Lock size={11} className="mr-1 inline text-alert" />
        Masked tokens can be resolved back to originals only inside your vault, never re-exposed unless policy permits.
      </motion.div>
    </div>
  );
}
