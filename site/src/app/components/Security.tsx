"use client";

import {
  ShieldCheck, ShieldAlert, FileCheck2, Lock, Server, Wifi, Cpu, KeyRound,
} from "lucide-react";

const INPUT_GUARDS = [
  { t: "PII / PHI redaction", d: "Detect and mask identifiers (names, DOB, MRN, SSN, account numbers) before they reach the model. HIPAA, GDPR, GLBA-aligned." },
  { t: "Secret & key scrubbing", d: "API keys, tokens and credentials pasted into a document are stripped so they can never leak into a prompt or response." },
  { t: "Prompt-injection & scope", d: "Flag embedded 'ignore previous instructions', indirect injection from document text, and refuse off-domain requests." },
];

const OUTPUT_GUARDS = [
  { t: "Leak re-scan", d: "Re-scan every response for identifiers or secrets; redact in-place before delivery." },
  { t: "Groundedness & citations", d: "Faithfulness check plus citation verification so claims trace to a real source span." },
  { t: "Sensitive-request refusal", d: "Requests for identifiers, credentials, or out-of-scope data are blocked and audit-logged." },
];

const DEPLOY = [
  { icon: Wifi, t: "WiFi / LAN-only", d: "Bind every service to a private subnet, enforce a zero-egress proxy, and require mTLS between components. Nothing leaves the building." },
  { icon: Server, t: "Offline / air-gapped", d: "No internet required. Embeddings (TEI, Infinity), reranker, and LLM (vLLM, TGI, Ollama) run on local GPUs with an on-prem vault." },
  { icon: Cpu, t: "Your own server GPUs", d: "Self-host the full stack: no per-token fees, no third-party calls. Example node: 4x A100 serves 340 queries/sec at p50 740ms." },
  { icon: KeyRound, t: "Extra encryption layer", d: "TLS in transit, AES-256 at rest, envelope encryption via KMS, field-level encryption for PHI, and tamper-evident audit logs." },
];

export default function Security() {
  return (
    <section id="security" className="mx-auto max-w-6xl px-4 py-20">
      <div className="mx-auto max-w-2xl text-center">
        <div className="eyebrow"><Lock size={12} className="text-alert" /> Security, guardrails &amp; PII</div>
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Keep it yours, keep it locked down</h2>
        <p className="mt-4 text-slate-600 dark:text-slate-300">
          Guardrails gate both sides of the model. The whole stack can run offline, on
          your own GPUs, inside your network, with an on-prem vault holding every
          identifier.
        </p>
      </div>

      <div className="mt-12 grid gap-5 md:grid-cols-2">
        <div className="card p-5">
          <div className="mb-3 flex items-center gap-2"><ShieldAlert size={16} className="text-alert" /><p className="font-medium">Input guardrails</p></div>
          <ul className="space-y-3">
            {INPUT_GUARDS.map((g) => (
              <li key={g.t}>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{g.t}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-slate-600 dark:text-slate-400">{g.d}</p>
              </li>
            ))}
          </ul>
        </div>
        <div className="card p-5">
          <div className="mb-3 flex items-center gap-2"><FileCheck2 size={16} className="text-accent" /><p className="font-medium">Output guardrails</p></div>
          <ul className="space-y-3">
            {OUTPUT_GUARDS.map((g) => (
              <li key={g.t}>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{g.t}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-slate-600 dark:text-slate-400">{g.d}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* deployment modes */}
      <div className="mt-10">
        <h3 className="flex items-center gap-2 text-xl font-semibold"><Server size={18} className="text-primary" /> Deployment &amp; isolation</h3>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {DEPLOY.map((d) => (
            <div key={d.t} className="card p-5">
              <d.icon size={18} className="text-primary" />
              <h4 className="mt-3 text-sm font-medium">{d.t}</h4>
              <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-400">{d.d}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-alert/30 bg-alert/5 p-3 text-xs text-slate-600 dark:text-slate-300">
          <Lock size={13} className="text-alert" />
          Default posture: zero data egress, reversible tokenization vault on-prem, and the model only ever sees de-identified tags.
        </div>
      </div>
    </section>
  );
}
