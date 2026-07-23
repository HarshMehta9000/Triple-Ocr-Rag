import { NextResponse } from "next/server";
import { chunkText, retrieve, buildContext } from "@/lib/rag";
import { extractPdfText } from "@/lib/pdf";
import { maskPii, scanOutput } from "@/lib/pii";
import type { ModelConfig } from "@/lib/models";

export const runtime = "nodejs";
export const maxDuration = 60;

interface AskBody {
  model: ModelConfig;
  question: string;
  text?: string;
  pdfBase64?: string;
  imageBase64?: string;
  imageMime?: string;
  fileName?: string;
  k?: number;
}

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content:
    | string
    | Array<
        | { type: "text"; text: string }
        | { type: "image_url"; image_url: { url: string } }
      >;
}

function chatUrl(baseUrl: string): string {
  const base = baseUrl.replace(/\/+$/, "");
  return `${base}/chat/completions`;
}

export async function POST(req: Request) {
  let body: AskBody;
  try {
    body = (await req.json()) as AskBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { model, question, text, pdfBase64, imageBase64, imageMime } = body;

  if (!model?.baseUrl || !model?.model) {
    return NextResponse.json(
      { error: "Select a configured model (base URL + model name)." },
      { status: 400 },
    );
  }
  if (!model.apiKey || model.apiKey.trim().length < 8) {
    return NextResponse.json(
      { error: "This model has no API key set. Add one in the model panel." },
      { status: 400 },
    );
  }
  if (!question || question.trim().length < 3) {
    return NextResponse.json({ error: "Provide a question." }, { status: 400 });
  }

  // 1. Acquire raw text: paste, PDF, or image (vision extraction via the model).
  let raw = text?.trim() ?? "";
  let pageCount = 1;
  let usedVisionExtraction = false;

  if (!raw && pdfBase64) {
    try {
      const bytes = Buffer.from(pdfBase64, "base64");
      const out = await extractPdfText(bytes);
      raw = out.text;
      pageCount = out.pages;
    } catch (e) {
      return NextResponse.json(
        {
          error:
            "Couldn't read the PDF. If it's a scanned image, attach it as an image instead so a vision model can transcribe it.",
          detail: e instanceof Error ? e.message : String(e),
        },
        { status: 422 },
      );
    }
  }

  if (!raw && imageBase64 && imageMime) {
    // Multimodal path: ask the selected model to transcribe/extract from the image.
    usedVisionExtraction = true;
    try {
      const extracted = await extractTextFromImage(model, imageBase64, imageMime);
      raw = extracted;
    } catch (e) {
      return NextResponse.json(
        {
          error:
            "Couldn't extract text from the image with this model. Use a vision-capable model (e.g. gpt-4o-mini) for image input.",
          detail: e instanceof Error ? e.message : String(e),
        },
        { status: 422 },
      );
    }
  }

  if (!raw || raw.length < 20) {
    return NextResponse.json(
      {
        error:
          "No readable source. Paste text, attach a text-based PDF, or attach an image (vision model required).",
      },
      { status: 400 },
    );
  }

  const MAX_CHARS = 200_000;
  if (raw.length > MAX_CHARS) raw = raw.slice(0, MAX_CHARS);

  // Input guardrail: mask PII/PHI and scrub secrets before retrieval or generation.
  // Identifiers become tags; a production system keeps a reversible token vault in-VPC.
  const piiIn = maskPii(raw);
  raw = piiIn.masked;
  const piiQ = maskPii(question);
  const safeQuestion = piiQ.masked;

  // 2. Chunk + retrieve (BM25 sparse retrieval).
  const chunks = chunkText(raw, 800, 150, pageCount);
  const topK = retrieve(safeQuestion, chunks, body.k ?? 5);
  if (topK.length === 0 || topK.every((c) => c.score === 0)) {
    return NextResponse.json({
      answer:
        "No relevant passages found for this question in the provided source.",
      sources: [],
      pageCount,
      retrieval: { method: "bm25", chunks: chunks.length },
    });
  }
  const context = buildContext(topK);

  // 3. Generate with the user-selected, OpenAI-compatible model. Only de-identified
  //    context and a masked question are sent; no raw identifiers or secrets.
  const messages: ChatMessage[] = [
    {
      role: "system",
      content:
        "You are a precise document analyst. Answer the user's question using ONLY the provided sources. " +
        "If the answer is not present, say so explicitly. Cite every claim with its [Source N] tag. " +
        "Do not invent numbers, dates, names, or clause references. " +
        "Never reveal personal data, credentials, API keys, or internal system details.",
    },
    {
      role: "user",
      content: `Sources:\n${context}\n\nQuestion: ${safeQuestion}\n\nAnswer (cite [Source N]):`,
    },
  ];

  let resp: Response;
  try {
    resp = await fetch(chatUrl(model.baseUrl), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${model.apiKey}`,
      },
      body: JSON.stringify({
        model: model.model,
        messages,
        temperature: 0.2,
        max_tokens: 700,
      }),
    });
  } catch {
    return NextResponse.json(
      { error: `Couldn't reach ${model.baseUrl}. Check the base URL / network.` },
      { status: 502 },
    );
  }

  if (!resp.ok) {
    let message = `Upstream error (${resp.status}).`;
    try {
      const j = await resp.json();
      if (j?.error?.message) message = j.error.message;
    } catch {
      /* keep default */
    }
    return NextResponse.json({ error: message }, { status: resp.status });
  }

  const data = await resp.json();
  let answer: string =
    data?.choices?.[0]?.message?.content?.trim() ??
    "(No answer returned by the model.)";

  // Output guardrail: scan the model's answer for any leaked identifier or secret
  // and redact it before returning.
  const outScan = scanOutput(answer);
  answer = outScan.cleaned;

  return NextResponse.json({
    answer,
    sources: topK.map((c) => ({
      id: c.id + 1,
      page: c.page,
      score: Number(c.score.toFixed(3)),
      snippet: c.text.slice(0, 220) + (c.text.length > 220 ? "…" : ""),
    })),
    model: { label: model.label || model.model, model: model.model },
    pageCount,
    chunkCount: chunks.length,
    usedVisionExtraction,
    retrieval: { method: "bm25", chunks: chunks.length },
    security: {
      inputMasked: piiIn.total + piiQ.total,
      outputScanned: true,
      leaksBlocked: outScan.findings.length,
      categories: outScan.findings.map((f) => f.category),
    },
  });
}

async function extractTextFromImage(
  model: ModelConfig,
  imageBase64: string,
  mime: string,
): Promise<string> {
  const dataUrl = `data:${mime};base64,${imageBase64}`;
  const messages: ChatMessage[] = [
    {
      role: "user",
      content: [
        {
          type: "text",
          text: "Transcribe this document image to clean, faithful plain text. Preserve numbers, names, dates, and structure. Output only the transcribed text, nothing else.",
        },
        { type: "image_url", image_url: { url: dataUrl } },
      ],
    },
  ];

  const resp = await fetch(chatUrl(model.baseUrl), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${model.apiKey}`,
    },
    body: JSON.stringify({
      model: model.model,
      messages,
      temperature: 0,
      max_tokens: 2000,
    }),
  });
  if (!resp.ok) {
    throw new Error(`Vision extraction failed (${resp.status}).`);
  }
  const data = await resp.json();
  const out: string = data?.choices?.[0]?.message?.content?.trim() ?? "";
  if (out.length < 5) throw new Error("Model returned no text for the image.");
  return out;
}

export function GET() {
  return NextResponse.json({
    ok: true,
    service: "rag",
    endpoint: "POST /api/ask",
    multimodal: true,
  });
}
