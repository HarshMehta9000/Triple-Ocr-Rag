// Retrieval utilities: semantic chunking + Okapi BM25 retrieval.
// Dependency-free (pure TS) so it fits Vercel/Netlify free-tier limits.
// BM25 is the industry-standard sparse/lexical retriever; the explainer covers
// how this combines with dense embeddings in a *hybrid* search setup.

export interface Chunk {
  id: number;
  text: string;
  page: number;
  charStart: number;
}

const SENTENCE_SPLIT = /(?<=[.!?])\s+/;

const STOP = new Set([
  "the", "and", "for", "are", "but", "not", "you", "all", "any", "can", "from",
  "her", "was", "one", "our", "out", "has", "have", "this", "that", "with",
  "will", "your", "they", "them", "their", "what", "when", "which", "who",
  "whom", "whose", "where", "why", "how", "into", "such", "than", "then",
  "there", "these", "those", "been", "were", "more", "most", "some", "each",
  "other", "its", "his", "hers", "we", "us", "our", "my", "me", "mine",
]);

function tokenize(s: string): string[] {
  const m = s.toLowerCase().match(/[a-z0-9]{2,}/g) ?? [];
  return m.filter((t) => !STOP.has(t));
}

export function chunkText(
  raw: string,
  targetSize = 800,
  overlap = 150,
  page = 1,
): Chunk[] {
  const text = raw.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  if (!text) return [];

  const sentences = text
    .split(SENTENCE_SPLIT)
    .map((s) => s.trim())
    .filter(Boolean);

  const chunks: Chunk[] = [];
  let current = "";
  let charStart = 0;
  let id = 0;

  const push = () => {
    const t = current.trim();
    if (t.length > 0) chunks.push({ id: id++, text: t, page, charStart });
    current = "";
  };

  for (const sentence of sentences) {
    if ((current + " " + sentence).trim().length > targetSize && current) {
      push();
      charStart += current.length;
      const tail = chunks[chunks.length - 1]?.text.slice(-overlap) ?? "";
      current = tail + " " + sentence;
    } else {
      current = current ? current + " " + sentence : sentence;
    }
  }
  push();
  return chunks;
}

export interface ScoredChunk extends Chunk {
  score: number;
}

// Okapi BM25 with k1=1.5, b=0.75 (standard defaults).
export function retrieve(query: string, chunks: Chunk[], k = 5): ScoredChunk[] {
  if (chunks.length === 0) return [];

  const N = chunks.length;
  const docTokens: string[][] = chunks.map((c) => tokenize(c.text));
  const docLen = docTokens.map((d) => d.length);
  const avgDl = docLen.reduce((a, b) => a + b, 0) / N || 1;

  // document frequency per term
  const df = new Map<string, number>();
  for (const toks of docTokens) {
    for (const t of new Set(toks)) df.set(t, (df.get(t) ?? 0) + 1);
  }
  const idf = (term: string) => {
    const d = df.get(term) ?? 0;
    // BM25+ idf with +1 smoothing to keep it non-negative
    return Math.log(1 + (N - d + 0.5) / (d + 0.5));
  };

  const qTokens = tokenize(query);
  if (qTokens.length === 0) return [];

  const qCounts = new Map<string, number>();
  for (const t of qTokens) qCounts.set(t, (qCounts.get(t) ?? 0) + 1);

  const K1 = 1.5;
  const B = 0.75;

  const scored: ScoredChunk[] = chunks.map((c, i) => {
    const toks = docTokens[i];
    const dl = docLen[i];
    const tf = new Map<string, number>();
    for (const t of toks) tf.set(t, (tf.get(t) ?? 0) + 1);

    let s = 0;
    for (const [t, qf] of qCounts) {
      const f = tf.get(t);
      if (!f) continue;
      const denom = f + K1 * (1 - B + B * (dl / avgDl));
      s += idf(t) * (f * (K1 + 1)) / denom * qf;
    }
    return { ...c, score: s };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, k);
}

export function buildContext(scored: ScoredChunk[]): string {
  return scored
    .map(
      (c, i) =>
        `[Source ${i + 1} | page ${c.page} | bm25 ${c.score.toFixed(2)}]\n${c.text}`,
    )
    .join("\n\n");
}
