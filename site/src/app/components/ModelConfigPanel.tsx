"use client";

import { useEffect, useState } from "react";
import { ChevronDown, Cpu, KeyRound, ShieldCheck } from "lucide-react";
import { PROVIDER_PRESETS, emptySlots, STORAGE_KEY, type ModelSlot } from "@/lib/models";

interface Props {
  slots: ModelSlot[];
  setSlots: (s: ModelSlot[]) => void;
}

export default function ModelConfigPanel({ slots, setSlots }: Props) {
  const [open, setOpen] = useState<number | null>(0);
  const [show, setShow] = useState<Record<string, boolean>>({});

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setSlots(JSON.parse(raw));
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const persist = (next: ModelSlot[]) => {
    setSlots(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  };

  const update = (idx: number, patch: Partial<ModelSlot>) => {
    const next = slots.map((s, i) => (i === idx ? { ...s, ...patch } : s));
    persist(next);
  };

  const applyPreset = (idx: number, presetLabel: string) => {
    const p = PROVIDER_PRESETS.find((x) => x.label === presetLabel);
    if (!p) return;
    update(idx, { baseUrl: p.baseUrl, model: p.model, label: p.label });
  };

  const configured = (s: ModelSlot) =>
    s.apiKey.trim().length >= 8 && s.baseUrl.trim() && s.model.trim();

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <Cpu size={15} className="text-primary" /> 1 · Models (bring your own)
        </h3>
        <span className="text-xs text-slate-400">
          {slots.filter(configured).length}/3 configured · OpenAI-compatible
        </span>
      </div>

      {slots.map((slot, idx) => {
        const isOpen = open === idx;
        const ready = configured(slot);
        return (
          <div key={slot.id} className="card overflow-hidden">
            <button
              onClick={() => setOpen(isOpen ? null : idx)}
              className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
            >
              <div className="flex items-center gap-3">
                <span
                  className={`grid h-6 w-6 place-items-center rounded-md text-[11px] font-semibold ${
                    ready ? "bg-primary text-white" : "bg-slate-200 text-slate-500 dark:bg-white/10 dark:text-slate-400"
                  }`}
                >
                  {idx + 1}
                </span>
                <div>
                  <p className="text-sm font-medium">{slot.label || `Model ${idx + 1}`}</p>
                  <p className="font-mono text-[11px] text-slate-400">
                    {slot.model || "not set"} · {slot.baseUrl.replace(/^https?:\/\//, "")}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {ready ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                    <ShieldCheck size={11} /> ready
                  </span>
                ) : (
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-500 dark:bg-white/10 dark:text-slate-400">
                    not set
                  </span>
                )}
                <ChevronDown size={15} className={`text-slate-400 transition ${isOpen ? "rotate-180" : ""}`} />
              </div>
            </button>

            {isOpen && (
              <div className="space-y-3 border-t border-slate-200 px-4 py-4 dark:border-white/10">
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-1 block text-xs text-slate-500 dark:text-slate-400">Label</span>
                    <input
                      className="input w-full"
                      value={slot.label}
                      onChange={(e) => update(idx, { label: e.target.value })}
                      placeholder={`Model ${idx + 1}`}
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-xs text-slate-500 dark:text-slate-400">Quick-fill provider</span>
                    <select
                      className="input w-full"
                      value=""
                      onChange={(e) => applyPreset(idx, e.target.value)}
                    >
                      <option value="" disabled>Choose a preset…</option>
                      {PROVIDER_PRESETS.map((p) => (
                        <option key={p.label} value={p.label}>{p.label}</option>
                      ))}
                    </select>
                  </label>
                </div>
                <label className="block">
                  <span className="mb-1 block text-xs text-slate-500 dark:text-slate-400">Base URL</span>
                  <input
                    className="input w-full font-mono text-xs"
                    value={slot.baseUrl}
                    onChange={(e) => update(idx, { baseUrl: e.target.value })}
                    placeholder="https://api.openai.com/v1"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs text-slate-500 dark:text-slate-400">Model name</span>
                  <input
                    className="input w-full font-mono text-xs"
                    value={slot.model}
                    onChange={(e) => update(idx, { model: e.target.value })}
                    placeholder="gpt-4o-mini"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                    <KeyRound size={11} /> API key
                  </span>
                  <div className="flex gap-2">
                    <input
                      type={show[slot.id] ? "text" : "password"}
                      className="input w-full font-mono text-xs"
                      value={slot.apiKey}
                      onChange={(e) => update(idx, { apiKey: e.target.value })}
                      placeholder="sk-…"
                      autoComplete="off"
                      spellCheck={false}
                    />
                    <button onClick={() => setShow((s) => ({ ...s, [slot.id]: !s[slot.id] }))} className="btn-ghost text-xs">
                      {show[slot.id] ? "Hide" : "Reveal"}
                    </button>
                  </div>
                </label>
                <p className="text-[11px] leading-relaxed text-slate-400">
                  Stored only in this browser&apos;s localStorage, never sent to the server
                  except as the Authorization header for your own request, over HTTPS.
                </p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export { emptySlots };
