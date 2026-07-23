# Mortgage Document Intelligence System

> **Live site (deployed on Vercel):** https://triplemodelrag.vercel.app
> An interactive companion site (in [`site/`](./site)) walks through the full RAG pipeline,
> chunking and embedding techniques, 3D vector retrieval, a guardrailed chatbot, security,
> evals, and impact. Source: [`site/`](./site), details: [`site/README.md`](./site/README.md).

[![Vercel](https://img.shields.io/badge/Vercel-live-000?logo=vercel&logoColor=white)](https://triplemodelrag.vercel.app)
[![Demo GIFs](https://img.shields.io/badge/demos-GIFs-4f46e5)](./site/public)
[![Next.js](https://img.shields.io/badge/site-Next.js-0ea5e9?logo=next.js&logoColor=white)](https://nextjs.org)

## Demos

<p align="center">
  <img src="site/public/pipeline-flow.gif" width="100%" alt="Live RAG pipeline simulation with cost and review-time counters" />
</p>
<p align="center">
  <img src="site/public/vector-search.gif" width="32%" alt="Interactive 3D vector retrieval" />
  <img src="site/public/chatbot.gif" width="32%" alt="Grounded, guardrailed chatbot simulation" />
  <img src="site/public/site-tour.gif" width="32%" alt="Site tour" />
</p>

## Run the notebooks

The three pipelines are Jupyter notebooks. You can run them **offline** or in **Google Colab**.

**Offline (V3, no external OCR API):** V3's 5-tier cascade (PyMuPDF, pdfplumber, PyPDF2,
Tesseract, EasyOCR) runs entirely locally with no external OCR calls. For fully offline
generation, point it at a local Llama 3 server (Ollama or vLLM) instead of a hosted endpoint.

```bash
pip install -r requirements.txt
jupyter notebook pipeline_v3_multitier.ipynb
```

**Google Colab (V1, V2, V3):** open a notebook in Colab and add your API keys (Replicate
for V1/V2; an OpenAI-compatible key for V3 generation) as Colab Secrets.

| Pipeline | Open in Colab | Needs |
|----------|---------------|-------|
| V1 DocTR + DeepSeek | [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/HarshMehta9000/Triple-Ocr-Rag/blob/main/pipeline_v1_doctr_deepseek.ipynb) | Replicate key |
| V2 Chandra OCR | [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/HarshMehta9000/Triple-Ocr-Rag/blob/main/pipeline_v2_chandra.ipynb) | Replicate key |
| V3 Multi-tier | [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/HarshMehta9000/Triple-Ocr-Rag/blob/main/pipeline_v3_multitier.ipynb) | Generation key (or local model) |

---

## Three Pipelines, Three OCR Strategies

Three production RAG (Retrieval-Augmented Generation) pipelines for processing 200+ page
mortgage PDFs. Each pipeline uses a different OCR strategy, all delivering natural language
Q&A with source citations, confidence scores, and a Gradio UI.

| Pipeline | File | Primary OCR | Embeddings | LLM | Key Strength |
|----------|------|-------------|------------|-----|-------------|
| **V1** | `pipeline_v1_doctr_deepseek.ipynb` | DocTR + DeepSeek OCR | BGE-large-en-v1.5 + Reranker | DeepSeek via Replicate | Word-level bounding boxes for source highlighting; dual OCR comparison |
| **V2** | `pipeline_v2_chandra.ipynb` | Chandra OCR | BGE-large-en-v1.5 + Reranker | Chandra via Replicate | 40+ language support; 99.99% multilingual accuracy; 83.1 benchmark score |
| **V3** | `pipeline_v3_multitier.ipynb` | 5-tier cascade (PyMuPDF, pdfplumber, PyPDF2, Tesseract, EasyOCR) | sentence-transformers/all-mpnet-base-v2 | Llama 3 70B | Zero external OCR dependency; handles any PDF type via fallback |

All three share the same core architecture: extract text, chunk semantically, embed, index
in FAISS, retrieve, then generate an answer with source attribution.

Built during an AI Engineering externship at [Outamation](https://www.outamation.com/), where
the goal was to find the most reliable extraction approach for complex mortgage documents:
scanned pages, tables, degraded quality, and multi-hundred-page packages.

### Sample documents

| | |
| :---: | :---: |
| ![Tocr 1](Tocr1.jpg) | ![Tocr 2](Tocr2.jpg) |
| ![Extern 1](Extern1.png) | ![Extern 2](Extern2.png) |
| ![Extern 3](Extern3.png) | ![Extern 4](Extern4.png) |
| ![Extern 5](Extern5.png) | ![Extern 6](Extern6.png) |
| ![Extern 7](Extern7.png) | ![Extern 8](Extern8.png) |

## Why Three Versions?

Mortgage documents are unpredictable. A single loan package might contain native digital
text, scanned pages from the 1980s, handwritten annotations, and complex fee tables, all in
one PDF. No single OCR engine handles everything well.

**V1 (DocTR + DeepSeek)** was built first. DocTR provides word-level bounding boxes,
enabling visual source highlighting on the original page. DeepSeek OCR runs as a secondary
engine via Replicate, and the system compares outputs from both to select the
highest-quality extraction per page. Uses BGE-large embeddings with a cross-encoder reranker
for high-precision retrieval.

**V2 (Chandra OCR)** was built to test a newer engine. Chandra scored 83.1 on OCR benchmarks,
supports 40+ languages with 99.99% multilingual accuracy, and processes pages at 0.025s on
H100 GPUs. It runs via Replicate with retry logic and timeout handling. Same BGE + reranker
retrieval stack as V1. Best for multilingual or math-heavy mortgage documents.

**V3 (Multi-Tier Fallback)** was built for zero-cost, zero-dependency reliability. Instead of
relying on any external API for OCR, it cascades through five local extraction methods,
keeping the highest-confidence result. Uses sentence-transformers for embeddings and a
free-tier Llama 3 70B endpoint for generation. Best for environments where external API
access is restricted, and the only path that runs fully offline for OCR.

## System Architecture

```text
                    +-----------------------------------+
                    |           PDF Upload              |
                    +----------------+------------------+
                                     |
                  +------------------+------------------+
                  v                  v                  v
          +------------+     +-------------+     +----------------+
          | V1: DocTR  |     | V2: Chandra |     | V3: 5-Tier     |
          | + DeepSeek |     |    OCR      |     | Cascade        |
          +-----+------+     +------+------+     +-------+--------+
                |                   |                    |
                +-------------------+--------------------                                    v
                         +-----------------------+
                         |  Semantic Chunking    |
                         |  (sentence boundary,  |
                         |   overlap, metadata)  |
                         +----------+------------+
                                    v
                         +-----------------------+
                         |  Embedding + Index    |
                         |  BGE-large or MPNet   |
                         |  FAISS L2 search      |
                         +----------+------------+
                                    v
                         +-----------------------+
                         |  Retrieval + Rerank   |
                         |  (V1/V2 cross-encoder |
                         |   reranker)           |
                         +----------+------------+
                                    v
                         +-----------------------+
                         |  Answer Generation    |
                         |  Llama 3 70B /        |
                         |  DeepSeek / Replicate |
                         +----------+------------+
                                    v
                         +-----------------------+
                         |  Gradio UI            |
                         |  Chat + Sources +     |
                         |  Confidence Scores    |
                         +-----------------------+
```
