// PDF text extraction using `unpdf`, a bundler-friendly fork of pdf.js built
// for serverless/edge runtimes (no worker, no native deps, no webpack mangling).
// Note: extracts embedded text only. Scanned/image-only PDFs return empty.
import { extractText, getDocumentProxy } from "unpdf";

interface ExtractResult {
  text: string;
  pages: number;
}

export async function extractPdfText(bytes: Buffer): Promise<ExtractResult> {
  const pdf = await getDocumentProxy(new Uint8Array(bytes));
  const { text, totalPages } = await extractText(pdf, { mergePages: true });
  return {
    text: (text ?? "").trim(),
    pages: totalPages ?? 1,
  };
}
