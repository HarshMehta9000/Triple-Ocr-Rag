// Provider-agnostic model configuration. Any OpenAI-compatible /chat/completions
// endpoint works (OpenAI, Together, Mistral, Anyscale, vLLM, Ollama, etc.).
// The user configures three slots and picks which one to run a query with.

export interface ModelConfig {
  id: string;
  label: string;
  baseUrl: string; // e.g. https://api.openai.com/v1
  apiKey: string;
  model: string; // e.g. gpt-4o-mini
}

export interface ModelSlot extends ModelConfig {
  enabled: boolean;
}

export const PROVIDER_PRESETS: { label: string; baseUrl: string; model: string }[] = [
  { label: "OpenAI", baseUrl: "https://api.openai.com/v1", model: "gpt-4o-mini" },
  { label: "Together", baseUrl: "https://api.together.xyz/v1", model: "meta-llama/Llama-3-70b-chat-hf" },
  { label: "Mistral", baseUrl: "https://api.mistral.ai/v1", model: "mistral-large-latest" },
  { label: "Anyscale", baseUrl: "https://api.endpoints.anyscale.com/v1", model: "meta-llama/Llama-3-70b-chat-hf" },
  { label: "Ollama (local)", baseUrl: "http://localhost:11434/v1", model: "llama3.1" },
];

export function emptySlots(): ModelSlot[] {
  return [0, 1, 2].map((i) => ({
    id: `m${i + 1}`,
    label: `Model ${i + 1}`,
    baseUrl: "https://api.openai.com/v1",
    apiKey: "",
    model: "",
    enabled: false,
  }));
}

export const STORAGE_KEY = "rag_model_slots";
