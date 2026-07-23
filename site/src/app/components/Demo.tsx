"use client";

import { useEffect, useState } from "react";
import { Loader2, SendHorizontal, Sparkles, ScanText, ShieldCheck, ShieldAlert, Lock } from "lucide-react";
import ModelConfigPanel from "./ModelConfigPanel";
import DocumentPanel from "./DocumentPanel";
import { emptySlots, type ModelSlot, type ModelConfig } from "@/lib/models";

interface Source { id: number; page: number; score: number; snippet: string }
interface AskResponse {
  answer: string; sources: Source[];
  model?: { label?: string; model?: string };
  pageCount?: number; chunkCount?: number;
  usedVisionExtraction?: boolean;
  retrieval?: { method: string; chunks: number };
  security?: { inputMasked: number; outputScanned: boolean; leaksBlocked: number };
}
interface Turn {
  q: string; a: string; sources: Source[];
  modelLabel?: string; usedVision?: boolean; method?: string;
  inputMasked?: number; leaksBlocked?: number;
  error?: boolean;
}

export default function Demo() {
  const [slots, setSlots] = useState<ModelSlot[]>(emptySlots());
  const [selectedId, setSelectedId] = useState<string>("m1");
  const [mode, setMode] = useState<"pdf" | "image" | "text">("text");
  const [fileName, setFileName] = useState<string | null>(null);
  const [pdfBase64, setPdfBase64] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imageMime, setImageMime] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [question, setQuestion] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const configured = slots.filter(
    (s) => s.apiKey.trim().length >= 8 && s.baseUrl.trim() && s.model.trim(),
  );

  useEffect(() => {
    if (configured.length && !configured.find((s) => s.id === selectedId)) {
      setSelectedId(configured[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slots]);

  const hasSource =
    mode === "pdf" ? !!pdfBase64 : mode === "image" ? !!imageBase64 : text.trim().length >= 20;

  const canAsk = !!configured.find((s) => s.id === selectedId) && question.trim().length >= 3 && hasSource && !loading;

  async function ask() {
    setErr(null);
    if (!canAsk) return;
    const slot = slots.find((s) => s.id === selectedId)!;
    const model: ModelConfig = {
      id: slot.id, label: slot.label, baseUrl: slot.baseUrl, apiKey: slot.apiKey, model: slot.model,
    };
    setLoading(true);
    const currentQ = question.trim();
    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          question: currentQ,
          text: mode === "text" ? text : undefined,
          pdfBase64: mode === "pdf" ? pdfBase64 : undefined,
          imageBase64: mode === "image" ? imageBase64 : undefined,
          imageMime: mode === "image" ? imageMime ?? undefined : undefined,
          fileName: fileName ?? undefined,
        }),
      });
      const data: AskResponse & { error?: string } = await res.json();
      if (!res.ok) {
        setErr(data.error || `Request failed (${res.status}).`);
        setTurns((t) => [...t, { q: currentQ, a: data.error || "Request failed.", sources: [], error: true }]);
      } else {
        setTurns((t) => [...t, {
          q: currentQ, a: data.answer, sources: data.sources,
          modelLabel: data.model?.label || data.model?.model,
          usedVision: data.usedVisionExtraction,
          method: data.retrieval?.method,
          inputMasked: data.security?.inputMasked,
          leaksBlocked: data.security?.leaksBlocked,
        }]);
      }
      setQuestion("");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Network error.");
    } finally {
      setLoading(false);
    }
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") { e.preventDefault(); ask(); }
  };

  return (
    <div className="space-y-4">
      <ModelConfigPanel slots={slots} setSlots={setSlots} />

      <DocumentPanel
        mode={mode} setMode={setMode}
        fileName={fileName} setFileName={setFileName}
        pdfBase64={pdfBase64} setPdfBase64={setPdfBase64}
        imageBase64={imageBase64} setImageBase64={setImageBase64}
        imageMime={imageMime} setImageMime={setImageMime}
        text={text} setText={setText}
      />

      <section className="card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-sm font-semibold">3 · Ask</h3>
          <label className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            Run with
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="input py-1 text-xs"
            >
              {slots.map((s, i) => (
                <option key={s.id} value={s.id}>
                  {s.label || `Model ${i + 1}`}
                  {s.apiKey.trim().length >= 8 && s.model.trim() ? "" : " (not configured)"}
                </option>
              ))}
            </select>
          </label>
        </div>

        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Ask something answerable from the source…"
          className="input mt-3 h-20 w-full resize-y"
        />

        <div className="mt-3 flex items-center justify-between">
          <p className="text-xs text-slate-400">
            {configured.length === 0
              ? "Configure at least one model above to begin."
              : loading ? "Working…" : "⌘/Ctrl + Enter to send"}
          </p>
          <button onClick={ask} disabled={!canAsk} className="btn-primary">
            {loading ? (<><Loader2 size={16} className="animate-spin" /> Asking…</>)
                    : (<><SendHorizontal size={16} /> Ask</>)}
          </button>
        </div>
        {err && <p className="mt-2 text-xs text-red-500">{err}</p>}
      </section>

      {turns.length > 0 && (
        <section className="space-y-4">
          {turns.map((t, i) => (
            <div key={i} className="card p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Question</p>
              <p className="mt-1 text-sm font-medium">{t.q}</p>

              <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-400">Answer</p>
              <p className={`mt-1 whitespace-pre-wrap text-sm leading-relaxed ${t.error ? "text-red-500" : "text-slate-700 dark:text-slate-200"}`}>
                {!t.error && <Sparkles size={13} className="mr-1 inline text-primary" />}
                {t.a}
              </p>

              {!t.error && (
                <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                  {t.modelLabel && <span className="tag font-mono">{t.modelLabel}</span>}
                  {t.method && <span className="tag font-mono">retrieval: {t.method}</span>}
                  {t.usedVision && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-primary">
                      <ScanText size={11} /> vision extraction
                    </span>
                  )}
                  {(t.inputMasked ?? 0) > 0 && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-alert/10 px-2 py-0.5 text-alert">
                      <ShieldCheck size={11} /> {t.inputMasked} PII masked
                    </span>
                  )}
                  {(t.leaksBlocked ?? 0) > 0 && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-alert/10 px-2 py-0.5 text-alert">
                      <ShieldAlert size={11} /> {t.leaksBlocked} leak blocked
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-emerald-600 dark:text-emerald-400">
                    <Lock size={11} /> output scanned
                  </span>
                </div>
              )}

              {t.sources.length > 0 && (
                <>
                  <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-400">Sources</p>
                  <ul className="mt-2 space-y-2">
                    {t.sources.map((s) => (
                      <li key={s.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs dark:border-white/10 dark:bg-white/5">
                        <div className="mb-1 flex items-center justify-between">
                          <span className="font-semibold text-slate-600 dark:text-slate-300">[Source {s.id}] · page {s.page}</span>
                          <span className="font-mono text-slate-400">bm25 {s.score.toFixed(2)}</span>
                        </div>
                        <p className="text-slate-600 dark:text-slate-400">{s.snippet}</p>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
