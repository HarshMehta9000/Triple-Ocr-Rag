// PII / secret detection and masking. Used as an input guardrail (mask before the
// text reaches the model) and an output guardrail (scan the model's answer for any
// leaked identifier or key). Pattern-based; production systems add NER (e.g. Presidio,
// Microsoft Recognizers) and a reversible token vault kept inside the customer's VPC.

export type Category =
  | "EMAIL" | "SSN" | "PHONE" | "CARD" | "DOB"
  | "MRN" | "MEMBER" | "SECRET";

export interface Finding {
  category: Category;
  preview: string; // truncated original, for logging/counts only
}

export interface MaskResult {
  masked: string;
  counts: Record<Category, number>;
  total: number;
}

const patterns: { re: RegExp; category: Category }[] = [
  // API keys / tokens / cloud secrets, checked first so they win over generic hex.
  { re: /\b(sk-[A-Za-z0-9_]{20,})\b/g, category: "SECRET" },
  { re: /\b(gsk_[A-Za-z0-9_]{20,})\b/g, category: "SECRET" },
  { re: /\b(AKIA[0-9A-Z]{16})\b/g, category: "SECRET" },
  { re: /\b(eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,})\b/g, category: "SECRET" },
  // Email
  { re: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g, category: "EMAIL" },
  // SSN
  { re: /\b\d{3}-\d{2}-\d{4}\b/g, category: "SSN" },
  // Credit card (13–16 digits, optional separators)
  { re: /\b(?:\d[ -]?){13,16}\b/g, category: "CARD" },
  // Dates that look like DOB (YYYY-MM-DD, DD/MM/YYYY, MM/DD/YYYY)
  { re: /\b(?:19|20)\d{2}[-/](?:0[1-9]|1[0-2])[-/](?:0[1-9]|[12]\d|3[01])\b/g, category: "DOB" },
  { re: /\b(?:0[1-9]|[12]\d|3[01])[/](?:0[1-9]|1[0-2])[/](?:19|20)\d{2}\b/g, category: "DOB" },
  // Phone (US-ish, requires separators or country code to reduce false positives)
  { re: /(?:(?:\+1|1)[\s.-]?)?\(?\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}\b/g, category: "PHONE" },
  // Labelled identifiers: MRN / Member / Account / Policy / Claim numbers
  { re: /\b(?:MRN|Member|Acct|Account|Policy|Claim)\s*#?\s*[A-Z0-9][A-Z0-9-]{3,}\b/gi, category: "MRN" },
];

const EMPTY: Record<Category, number> = {
  EMAIL: 0, SSN: 0, PHONE: 0, CARD: 0, DOB: 0, MRN: 0, MEMBER: 0, SECRET: 0,
};

function preview(s: string) {
  const t = s.trim();
  return t.length <= 12 ? t : t.slice(0, 4) + "••••";
}

/** Mask every PII/secret match, replacing it with a category tag. */
export function maskPii(input: string): MaskResult {
  const counts: Record<Category, number> = { ...EMPTY };
  const findings: { start: number; end: number; tag: Category }[] = [];

  for (const { re, category } of patterns) {
    re.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(input))) {
      findings.push({ start: m.index, end: m.index + m[0].length, tag: category });
      counts[category]++;
    }
  }
  // resolve overlaps: keep earliest, drop overlaps
  findings.sort((a, b) => a.start - b.start || b.end - a.end);
  const kept: typeof findings = [];
  let lastEnd = -1;
  for (const f of findings) {
    if (f.start >= lastEnd) {
      kept.push(f);
      lastEnd = f.end;
    }
  }

  let out = "";
  let cursor = 0;
  for (const f of kept) {
    out += input.slice(cursor, f.start) + `[${f.tag}]`;
    cursor = f.end;
  }
  out += input.slice(cursor);

  const total = kept.length;
  return { masked: out, counts, total };
}

export interface ScanResult {
  cleaned: string;
  findings: Finding[];
  leaked: boolean;
}

/** Scan model output for any identifier/secret that shouldn't be returned. */
export function scanOutput(text: string): ScanResult {
  const { masked, total } = maskPii(text);
  const findings: Finding[] = [];
  if (total > 0) {
    // rebuild finding previews with a second pass
    for (const { re, category } of patterns) {
      re.lastIndex = 0;
      let m: RegExpExecArray | null;
      while ((m = re.exec(text))) findings.push({ category, preview: preview(m[0]) });
    }
  }
  return { cleaned: masked, findings, leaked: total > 0 };
}
