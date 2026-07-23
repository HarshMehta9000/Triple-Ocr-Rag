"use client";

import { useTheme } from "./ThemeProvider";
import { Github, Moon, Sun, Layers } from "lucide-react";

const LINKS = [
  { href: "#pipeline", label: "Pipeline" },
  { href: "#retrieval", label: "Retrieval" },
  { href: "#vector", label: "Vector" },
  { href: "#chatbot", label: "Chatbot" },
  { href: "#security", label: "Security" },
  { href: "#impact", label: "Impact" },
];

export default function NavBar() {
  const { theme, toggle } = useTheme();
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/60 bg-white/70 backdrop-blur-xl dark:border-white/10 dark:bg-[#0b0d12]/70">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <a href="#top" className="flex items-center gap-2 font-bold">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-primary via-accent to-primary text-white shadow-md">
            <Layers size={18} />
          </span>
          <span className="text-sm tracking-tight">
            Triple<span className="text-gradient">Model</span>RAG
          </span>
        </a>
        <div className="hidden items-center gap-1 md:flex">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href}
              className="rounded-lg px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-white">
              {l.label}
            </a>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={toggle} aria-label="Toggle theme"
            className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-100 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5">
            {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <a href="https://github.com/HarshMehta9000/Triple-Ocr-Rag" target="_blank" rel="noreferrer" aria-label="GitHub"
            className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-100 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5">
            <Github size={16} />
          </a>
          <a href="#chatbot" className="btn-primary hidden sm:inline-flex">Try the chatbot</a>
        </div>
      </nav>
    </header>
  );
}
