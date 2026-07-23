import NavBar from "./components/NavBar";
import Hero from "./components/Hero";
import RetrievalStack from "./components/RetrievalStack";
import VectorSearchSection from "./components/VectorSearchSection";
import FailureModes from "./components/FailureModes";
import ChatbotSimulation from "./components/ChatbotSimulation";
import Security from "./components/Security";
import EvalsGuardrails from "./components/EvalsGuardrails";
import Impact from "./components/Impact";
import Demo from "./components/Demo";
import { Github } from "lucide-react";

export default function Page() {
  return (
    <>
      <NavBar />
      <main>
        <Hero />
        <RetrievalStack />
        <VectorSearchSection />
        <FailureModes />
        <ChatbotSimulation />
        <Security />
        <EvalsGuardrails />
        <Impact />

        <section id="demo" className="mx-auto max-w-3xl px-4 py-20">
          <div className="mx-auto max-w-2xl text-center">
            <div className="eyebrow">Run the pipeline</div>
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Try it with your own models
            </h2>
            <p className="mt-4 text-slate-600 dark:text-slate-300">
              Configure up to three OpenAI-compatible models, point at a PDF, image, or
              pasted text, and ask a question. Identifiers and secrets are masked before
              the model and the answer is scanned for leakage. No keys or data stored server-side.
            </p>
          </div>
          <div className="mt-10">
            <Demo />
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200/60 py-10 dark:border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 text-sm text-slate-500 dark:text-slate-400 sm:flex-row">
          <p>
            TripleModelRAG, the interactive companion to{" "}
            <a href="https://github.com/HarshMehta9000/Triple-Ocr-Rag" target="_blank" rel="noreferrer"
              className="inline-flex items-center gap-1 text-primary hover:underline">
              <Github size={13} /> Triple-Ocr-Rag
            </a>
          </p>
          <p>Bring your own models. No keys or data stored server-side.</p>
        </div>
      </footer>
    </>
  );
}
