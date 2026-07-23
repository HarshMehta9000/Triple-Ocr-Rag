"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bot, User, ShieldAlert, CheckCircle2, RefreshCw } from "lucide-react";

type Actor = "user" | "bot" | "guard";

interface Msg {
  actor: Actor;
  text: string;
  // running totals after this message appears
  tokens: number;
  cost: number;
  citations: number;
  pii: number;
  review?: number; // routed to human queue
  blocked?: number;
}

const SCRIPT: Msg[] = [
  { actor: "user", text: "Summarize rate and payment terms.", tokens: 410, cost: 0.011, citations: 0, pii: 31 },
  { actor: "bot", text: "30-year fixed at 6.875% APR. Principal & interest $2,841/mo. Rate locked 45 days. [3][7]", tokens: 880, cost: 0.022, citations: 2, pii: 31 },
  { actor: "user", text: "Any prepayment penalties?", tokens: 1010, cost: 0.025, citations: 2, pii: 31 },
  { actor: "bot", text: "No penalty in years 2 to 30. Year 1 only: 1% fee on principal above 20%. [12]", tokens: 1320, cost: 0.030, citations: 3, pii: 31 },
  { actor: "user", text: "What's the borrower's SSN?", tokens: 1410, cost: 0.032, citations: 3, pii: 31 },
  { actor: "guard", text: "Blocked. Identifiers are masked and access is audit-logged. A human reviewer can approve release with entitlement.", tokens: 1410, cost: 0.032, citations: 3, pii: 31, blocked: 1 },
  { actor: "user", text: "Flag anything risky.", tokens: 1520, cost: 0.034, citations: 3, pii: 31 },
  { actor: "bot", text: "DTI at 48.2% (limit 50%). Confidence 0.62. Routed to human reviewer queue. [5]", tokens: 1840, cost: 0.039, citations: 4, pii: 31, review: 1 },
];

const TYPE_MS = 750;
const HOLD_MS = 1500;

export default function ChatbotSimulation() {
  const [count, setCount] = useState(0);
  const [typing, setTyping] = useState(true);

  useEffect(() => {
    if (count >= SCRIPT.length) {
      const t = setTimeout(() => { setCount(0); setTyping(true); }, 3500);
      return () => clearTimeout(t);
    }
    if (typing) {
      const t = setTimeout(() => { setTyping(false); setCount((c) => c + 1); }, TYPE_MS);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setTyping(true), HOLD_MS);
    return () => clearTimeout(t);
  }, [count, typing]);

  const last = SCRIPT[Math.max(0, count - 1)];
  const reset = () => { setCount(0); setTyping(true); };

  return (
    <section id="chatbot" className="border-y border-slate-200/60 bg-white/40 py-20 dark:border-white/10 dark:bg-white/[0.015]">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mx-auto max-w-2xl text-center">
          <div className="eyebrow"><Bot size={12} className="text-primary" /> The assistant, live</div>
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">A grounded, guardrailed chat</h2>
          <p className="mt-4 text-slate-600 dark:text-slate-300">
            A scripted run showing cited answers, PII refusal, and human-in-the-loop
            escalation. Data is illustrative.
          </p>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-5">
          {/* chat window */}
          <div className="card flex h-[420px] flex-col p-0 lg:col-span-3">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-2.5 dark:border-white/10">
              <span className="inline-flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300">
                <span className="h-2 w-2 rounded-full bg-emerald-500" /> assistant · online
              </span>
              <button onClick={reset} className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
                <RefreshCw size={12} /> replay
              </button>
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              {SCRIPT.slice(0, count).map((m, i) => (
                <Bubble key={i} msg={m} />
              ))}
              {typing && count < SCRIPT.length && <Typing />}
            </div>
          </div>

          {/* live stats */}
          <div className="card flex flex-col gap-3 p-5 lg:col-span-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Live this session</p>
            <Stat label="Tokens used" value={last ? last.tokens.toLocaleString() : "0"} />
            <Stat label="Est. input cost" value={last ? `$${last.cost.toFixed(3)}` : "$0.000"} accent />
            <Stat label="Citations" value={last ? String(last.citations) : "0"} />
            <Stat label="PII masked" value={last ? String(last.pii) : "0"} />
            <Stat label="Leaks blocked" value={last && last.blocked ? String(last.blocked) : "0"} />
            <div className="mt-auto space-y-2">
              <Badge ok label="Grounded in sources" />
              {last && last.review ? (
                <div className="flex items-center gap-2 rounded-lg border border-alert/30 bg-alert/5 px-3 py-2 text-xs text-alert">
                  <ShieldAlert size={13} /> 1 answer routed to human review
                </div>
              ) : (
                <Badge ok label="Human in the loop" />
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Bubble({ msg }: { msg: Msg }) {
  const isUser = msg.actor === "user";
  const isGuard = msg.actor === "guard";
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className={`flex items-start gap-2 ${isUser ? "flex-row-reverse" : ""}`}
    >
      <span className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full ${
        isUser ? "bg-slate-200 text-slate-600 dark:bg-white/10 dark:text-slate-300"
        : isGuard ? "bg-alert/15 text-alert"
        : "bg-primary/15 text-primary"}`}>
        {isUser ? <User size={13} /> : isGuard ? <ShieldAlert size={13} /> : <Bot size={13} />}
      </span>
      <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
        isUser ? "bg-primary text-white"
        : isGuard ? "border border-alert/40 bg-alert/5 text-alert"
        : "border border-slate-200 bg-white text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200"}`}>
        {msg.text}
      </div>
    </motion.div>
  );
}

function Typing() {
  return (
    <div className="flex items-center gap-2">
      <span className="grid h-7 w-7 place-items-center rounded-full bg-primary/15 text-primary"><Bot size={13} /></span>
      <div className="flex gap-1 rounded-2xl border border-slate-200 bg-white px-3 py-2.5 dark:border-white/10 dark:bg-white/5">
        {[0, 1, 2].map((i) => (
          <motion.span key={i} className="h-1.5 w-1.5 rounded-full bg-slate-400"
            animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }} />
        ))}
      </div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white/50 px-3 py-2 dark:border-white/10 dark:bg-white/[0.02]">
      <span className="text-xs text-slate-500 dark:text-slate-400">{label}</span>
      <span className={`font-mono text-sm font-semibold ${accent ? "text-alert" : "text-slate-800 dark:text-slate-100"}`}>{value}</span>
    </div>
  );
}

function Badge({ label }: { ok?: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-3 py-2 text-xs text-emerald-700 dark:text-emerald-400">
      <CheckCircle2 size={13} /> {label}
    </div>
  );
}
