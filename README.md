# Mortgage Document Intelligence System

Three production RAG (Retrieval-Augmented Generation) pipelines for processing 200+ page mortgage PDFs. Each pipeline uses a different OCR strategy, all delivering natural language Q&A with source citations, confidence scores, and a Gradio UI.

Built during an AI Engineering externship at [Outamation](https://www.outamation.com/), where the goal was to find the most reliable extraction approach for complex mortgage documents — scanned pages, tables, degraded quality, and multi-hundred-page packages.

---

## Three Pipelines, Three OCR Strategies

| Pipeline | File | Primary OCR | Embeddings | LLM | Key Strength |
|----------|------|-------------|------------|-----|-------------|
| **V1** | `pipeline_v1_doctr_deepseek.ipynb` | DocTR + DeepSeek OCR | BGE-large-en-v1.5 + Reranker | DeepSeek via Replicate | Word-level bounding boxes for source highlighting; dual OCR comparison |
| **V2** | `pipeline_v2_chandra.ipynb` | Chandra OCR | BGE-large-en-v1.5 + Reranker | Chandra via Replicate | 40+ language support; 99.99% multilingual accuracy; 83.1 benchmark score |
| **V3** | `pipeline_v3_multitier.ipynb` | 5-tier cascade (PyMuPDF → pdfplumber → PyPDF2 → Tesseract → EasyOCR) | sentence-transformers/all-mpnet-base-v2 | Groq Llama 3 70B | Zero external OCR dependency; handles any PDF type via fallback |

All three share the same core architecture: extract text → chunk semantically → embed → index in FAISS → retrieve → generate answer with source attribution.

---

## Why Three Versions?

Mortgage documents are unpredictable. A single loan package might contain native digital text, scanned pages from the 1980s, handwritten annotations, and complex fee tables — all in one PDF. No single OCR engine handles everything well.

**V1 (DocTR + DeepSeek)** was built first. DocTR provides word-level bounding boxes, enabling visual source highlighting on the original page. DeepSeek OCR runs as a secondary engine via Replicate, and the system compares outputs from both to select the highest-quality extraction per page. Uses BGE-large embeddings with a cross-encoder reranker for high-precision retrieval.

**V2 (Chandra OCR)** was built to test a newer engine. Chandra scored 83.1 on OCR benchmarks, supports 40+ languages with 99.99% multilingual accuracy, and processes pages at 0.025s on H100 GPUs. It runs via Replicate with retry logic and timeout handling. Same BGE + reranker retrieval stack as V1. Best for multilingual or math-heavy mortgage documents.

**V3 (Multi-Tier Fallback)** was built for zero-cost, zero-dependency reliability. Instead of relying on any external API for OCR, it cascades through five local extraction methods, keeping the highest-confidence result. Uses sentence-transformers for embeddings and Groq's free-tier Llama 3 70B for generation. Best for environments where external API access is restricted.

---

## System Architecture

```
                    ┌─────────────────────────────────┐
                    │         PDF Upload               │
                    └──────────┬──────────────────────┘
                               │
              ┌────────────────┼────────────────┐
              ▼                ▼                ▼
     ┌────────────┐   ┌─────────────┐   ┌────────────────┐
     │  V1: DocTR │   │ V2: Chandra │   │ V3: 5-Tier     │
     │  + DeepSeek│   │    OCR      │   │ Cascade        │
     └─────┬──────┘   └──────┬──────┘   └───────┬────────┘
           │                 │                   │
           └─────────────────┼───────────────────┘
                             ▼
                  ┌──────────────────────┐
                  │  Semantic Chunking    │
                  │  (sentence-boundary,  │
                  │   overlap, metadata)  │
                  └──────────┬───────────┘
                             ▼
                  ┌──────────────────────┐
                  │  Embedding + Index    │
                  │  BGE-large or MPNet   │
                  │  FAISS L2 search      │
                  └──────────┬───────────┘
                             ▼
                  ┌──────────────────────┐
                  │  Retrieval + Rerank   │
                  │  (V1/V2: cross-encoder│
                  │   reranker)           │
                  └──────────┬───────────┘
                             ▼
                  ┌──────────────────────┐
                  │  Answer Generation    │
                  │  Groq / DeepSeek /    │
                  │  Replicate            │
                  └──────────┬───────────┘
                             ▼
                  ┌──────────────────────┐
                  │  Gradio UI            │
                  │  Chat + Sources +     │
                  │  Confidence Scores    │
                  └──────────────────────┘
```

---

## Key Features Across All Pipelines

**Extraction:**
- Multi-engine OCR with intelligent selection (V1: dual comparison, V2: Chandra with retries, V3: 5-tier cascade)
- Table detection and structured data extraction
- Per-page confidence scoring and extraction method tracking
- Real-time progress tracking with time estimation

**Retrieval:**
- Semantic chunking at sentence boundaries with configurable overlap
- Page-aware metadata on every chunk (source page, extraction method, confidence)
- FAISS vector similarity search
- Cross-encoder reranking in V1 and V2 for higher precision
- Structured key extraction via regex (loan amounts, interest rates, fees)

**Generation:**
- Source-attributed answers with page citations
- Confidence scoring combining retrieval similarity and extraction quality
- Model fallback chains for reliability
- Structured field extraction for common mortgage data points

**Interface:**
- Gradio web UI with chat, file upload, and processing status
- Visual source highlighting with bounding boxes (V1)
- Quick-question examples for common mortgage queries

---

## Performance

| Metric | V1 (DocTR+DeepSeek) | V2 (Chandra) | V3 (Multi-Tier) |
|--------|---------------------|--------------|-----------------|
| OCR Accuracy | High (dual-engine comparison) | 83.1 benchmark score | Varies by method (95% native, variable OCR) |
| Retrieval | BGE + reranker | BGE + reranker | MPNet bi-encoder |
| GPU Required | Yes (A100 recommended) | Yes (A100 recommended) | No (CPU-compatible) |
| External APIs | Replicate (DeepSeek) | Replicate (Chandra) | Groq (free tier) |
| Best For | Source highlighting, dual validation | Multilingual, high-accuracy | Zero-cost, no external OCR |

---

## Quick Start

All three pipelines run in **Google Colab** (recommended) or locally with a GPU.

### 1. Get API Keys

| Pipeline | Key Needed | Where to Get |
|----------|-----------|-------------|
| V1, V2 | Replicate API token | [replicate.com](https://replicate.com/) |
| V3 | Groq API key | [console.groq.com](https://console.groq.com/) |

### 2. Run in Colab

Open any notebook in Colab, add your API key where indicated (`YOUR_REPLICATE_API_TOKEN` or `YOUR_GROQ_API_KEY`), and run all cells. The Gradio interface launches with a shareable public URL.

### 3. Run Locally

```bash
pip install -r requirements.txt
sudo apt-get install tesseract-ocr poppler-utils  # for V3

# Set API keys
export REPLICATE_API_TOKEN="your_token"   # for V1/V2
export GROQ_API_KEY="your_key"            # for V3

jupyter notebook
```

---

## Repo Structure

```
mortgage-doc-rag-pipeline/
├── pipeline_v1_doctr_deepseek.ipynb   # DocTR + DeepSeek dual OCR
├── pipeline_v2_chandra.ipynb          # Chandra OCR (83.1 benchmark)
├── pipeline_v3_multitier.ipynb        # 5-tier local fallback cascade
├── requirements.txt
├── .gitignore
└── README.md
```

---

## Architecture Decisions

**Why three separate pipelines instead of one?**
Each OCR engine has different strengths, dependencies, and cost profiles. Chandra excels at multilingual and math-heavy content. DocTR provides bounding boxes for visual highlighting. The multi-tier cascade works without any external API. Keeping them separate lets you pick the right tool for the use case instead of loading all dependencies at once.

**Why BGE-large + reranker in V1/V2?**
BGE-large-en-v1.5 produces higher-quality embeddings than MiniLM for domain-specific content. The cross-encoder reranker (bge-reranker-large) rescores the top-k candidates after initial retrieval, significantly improving precision on ambiguous mortgage queries.

**Why FAISS over a hosted vector DB?**
For a single-user pipeline processing a handful of documents per session, FAISS in-memory is simpler, faster, and has zero infrastructure cost. A hosted solution (Pinecone, Weaviate) would be the right choice for a multi-user production deployment.

**Why Groq for V3?**
Groq offers free-tier access to Llama 3 70B with fast inference (100+ tokens/sec). For a zero-cost constraint with no GPU requirement, this was the best quality-per-dollar option.

---

## Limitations and Next Steps

- **No persistent index** — FAISS lives in memory, resets per session. Production version would persist to disk or a vector DB.
- **Single-user** — Gradio handles one session at a time. Multi-user needs a queue and session isolation.
- **Page-scoped chunking** — Chunks don't span page boundaries, which can lose context for clauses that break across pages.
- **OCR quality on handwriting** — All three engines struggle with handwritten annotations. A fine-tuned model for handwriting recognition would help.
- **No A/B evaluation framework** — The three pipelines were compared manually. Building an automated eval harness with labeled mortgage Q&A pairs would allow systematic comparison.

---

## Built With

| Tool | Purpose |
|------|---------|
| [DocTR](https://github.com/mindee/doctr) | OCR with word-level bounding boxes (V1) |
| [DeepSeek OCR](https://replicate.com/lucataco/deepseek-ocr) | Secondary OCR engine via Replicate (V1) |
| [Chandra OCR](https://replicate.com/datalab-to/ocr) | High-accuracy multilingual OCR via Replicate (V2) |
| [PyMuPDF](https://pymupdf.readthedocs.io/) / [pdfplumber](https://github.com/jsvine/pdfplumber) / [Tesseract](https://github.com/tesseract-ocr/tesseract) / [EasyOCR](https://github.com/JaidedAI/EasyOCR) | Local extraction cascade (V3) |
| [BGE-large-en-v1.5](https://huggingface.co/BAAI/bge-large-en-v1.5) | Embeddings + cross-encoder reranker (V1/V2) |
| [sentence-transformers](https://www.sbert.net/) | Embeddings (V3) |
| [FAISS](https://github.com/facebookresearch/faiss) | Vector similarity search |
| [Groq](https://groq.com/) | LLM inference — Llama 3 70B (V3) |
| [Gradio](https://gradio.app/) | Web UI |

---

## License

MIT
