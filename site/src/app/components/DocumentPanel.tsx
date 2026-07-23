"use client";

import { useRef, useState } from "react";
import { FileUp, ImageIcon, Type } from "lucide-react";

type Mode = "pdf" | "image" | "text";

interface Props {
  mode: Mode;
  setMode: (m: Mode) => void;
  fileName: string | null;
  setFileName: (n: string | null) => void;
  pdfBase64: string | null;
  setPdfBase64: (v: string | null) => void;
  imageBase64: string | null;
  setImageBase64: (v: string | null) => void;
  imageMime: string | null;
  setImageMime: (v: string | null) => void;
  text: string;
  setText: (v: string) => void;
}

const MAX_MB = 8;

function arrayBufferToBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(
      null,
      bytes.subarray(i, i + chunk) as unknown as number[],
    );
  }
  return btoa(binary);
}

export default function DocumentPanel(props: Props) {
  const { mode, setMode, fileName, setFileName, pdfBase64, setPdfBase64,
    imageBase64, setImageBase64, imageMime, setImageMime, text, setText } = props;
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  const accept = mode === "pdf" ? "application/pdf" : "image/*";

  const handleFile = async (file: File | undefined) => {
    setFileError(null);
    if (!file) return;
    if (mode === "pdf") {
      if (file.type !== "application/pdf") { setFileError("Upload a .pdf file."); return; }
    } else {
      if (!file.type.startsWith("image/")) { setFileError("Upload an image file."); return; }
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      setFileError(`File must be under ${MAX_MB}MB for the free-tier demo.`);
      return;
    }
    const buf = await file.arrayBuffer();
    const b64 = arrayBufferToBase64(buf);
    setFileName(file.name);
    if (mode === "pdf") {
      setPdfBase64(b64);
      setImageBase64(null);
      setImageMime(null);
    } else {
      setImageBase64(b64);
      setImageMime(file.type);
      setPdfBase64(null);
    }
  };

  const hasFile = mode === "pdf" ? !!pdfBase64 : !!imageBase64;

  return (
    <section className="card p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">2 · Source (multimodal)</h3>
        <div className="inline-flex overflow-hidden rounded-lg border border-slate-300 text-xs dark:border-white/15">
          {([
            ["pdf", "PDF", FileUp],
            ["image", "Image", ImageIcon],
            ["text", "Text", Type],
          ] as const).map(([m, label, Icon]) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`inline-flex items-center gap-1 px-3 py-1.5 transition ${
                mode === m
                  ? "bg-primary text-white"
                  : "bg-white/60 text-slate-600 hover:bg-white dark:bg-transparent dark:text-slate-300"
              }`}
            >
              <Icon size={12} /> {label}
            </button>
          ))}
        </div>
      </div>

      {mode === "text" ? (
        <div className="mt-3">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste source text: a policy clause, claim note, filing excerpt, passage from a book…"
            className="input h-40 w-full resize-y"
          />
          <p className="mt-1 text-right text-xs text-slate-400">{text.length.toLocaleString()} chars</p>
        </div>
      ) : (
        <div className="mt-3">
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files?.[0]); }}
            onClick={() => inputRef.current?.click()}
            className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-8 text-center transition ${
              dragging
                ? "border-primary bg-primary/5"
                : "border-slate-300 hover:border-primary/60 hover:bg-slate-50 dark:border-white/15 dark:hover:bg-white/5"
            }`}
          >
            {mode === "image" && imageBase64 ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`data:${imageMime};base64,${imageBase64}`}
                alt="preview"
                className="mb-2 max-h-32 rounded-lg object-contain"
              />
            ) : (
              <FileUp className="mb-2 text-primary" size={22} />
            )}
            <p className="text-sm text-slate-600 dark:text-slate-300">
              {hasFile ? (
                <><span className="font-medium text-slate-800 dark:text-slate-100">{fileName}</span> ready · click to replace</>
              ) : (
                <>Drop a {mode === "pdf" ? "text-based PDF" : "document image"} here, or click to browse</>
              )}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Max {MAX_MB}MB ·{" "}
              {mode === "pdf" ? "embedded text extracted" : "vision model transcribes the image"}
            </p>
            <input ref={inputRef} type="file" accept={accept} className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0])} />
          </div>
          {fileError && <p className="mt-2 text-xs text-red-500">{fileError}</p>}
          {hasFile && (
            <button
              type="button"
              onClick={() => {
                setFileName(null);
                setPdfBase64(null);
                setImageBase64(null);
                setImageMime(null);
                if (inputRef.current) inputRef.current.value = "";
              }}
              className="mt-2 text-xs text-slate-500 hover:underline dark:text-slate-400"
            >
              Remove file
            </button>
          )}
        </div>
      )}
    </section>
  );
}
