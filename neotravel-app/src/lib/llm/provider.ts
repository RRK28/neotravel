import { createOpenAI, openai } from "@ai-sdk/openai";
import type { LanguageModel } from "ai";

export type LlmProviderKind = "ollama" | "openai" | "none";

export interface ResolvedLlm {
  kind: LlmProviderKind;
  modelId: string;
  label: string;
  ollamaBaseUrl?: string;
}

const CACHE_TTL_MS = 30_000;
let cache: { value: ResolvedLlm; expiresAt: number } | null = null;

function ollamaBaseUrl(): string {
  return (process.env.OLLAMA_BASE_URL ?? "http://127.0.0.1:11434").replace(/\/$/, "");
}

/** Réinitialise le cache (utile en tests). */
export function resetLlmProviderCache(): void {
  cache = null;
}

/** Préfère un modèle local (sans suffixe :cloud) pour éviter les abonnements Ollama Cloud. */
export function pickOllamaModel(models: Array<{ name: string }>): string | null {
  if (!models.length) return null;

  const local = models.find((m) => !m.name.includes(":cloud"));
  return local?.name ?? models[0].name;
}

async function fetchOllamaModel(): Promise<string | null> {
  const base = ollamaBaseUrl();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 2000);

  try {
    const res = await fetch(`${base}/api/tags`, { signal: controller.signal });
    if (!res.ok) return null;

    const data = (await res.json()) as { models?: Array<{ name: string }> };
    if (process.env.OLLAMA_MODEL) return process.env.OLLAMA_MODEL;

    const picked = pickOllamaModel(data.models ?? []);
    return picked ?? "llama3.2";
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function isOllamaAvailable(): Promise<boolean> {
  const model = await fetchOllamaModel();
  return model !== null;
}

/**
 * Résout le fournisseur LLM par priorité :
 * 1. LLM_PROVIDER=openai → OpenAI (clé requise)
 * 2. LLM_PROVIDER=ollama → Ollama (doit tourner)
 * 3. Auto : Ollama si joignable, sinon OpenAI si clé, sinon none
 */
export async function resolveLlmProvider(): Promise<ResolvedLlm> {
  const forced = process.env.LLM_PROVIDER?.toLowerCase();

  if (forced === "demo" || forced === "none") {
    return { kind: "none", modelId: "", label: "Mode démo" };
  }

  const now = Date.now();
  if (cache && cache.expiresAt > now) {
    return cache.value;
  }

  let resolved: ResolvedLlm;

  if (forced === "openai") {
    if (!process.env.OPENAI_API_KEY) {
      resolved = { kind: "none", modelId: "", label: "OpenAI (clé manquante)" };
    } else {
      const modelId = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
      resolved = { kind: "openai", modelId, label: `OpenAI (${modelId})` };
    }
  } else if (forced === "ollama") {
    const modelId = (await fetchOllamaModel()) ?? process.env.OLLAMA_MODEL ?? "llama3.2";
    const up = await isOllamaAvailable();
    resolved = up
      ? {
          kind: "ollama",
          modelId,
          label: `Ollama (${modelId})`,
          ollamaBaseUrl: ollamaBaseUrl(),
        }
      : { kind: "none", modelId: "", label: "Ollama (hors ligne)" };
  } else {
    // Auto : Ollama d'abord
    const ollamaModel = await fetchOllamaModel();
    if (ollamaModel) {
      resolved = {
        kind: "ollama",
        modelId: ollamaModel,
        label: `Ollama (${ollamaModel})`,
        ollamaBaseUrl: ollamaBaseUrl(),
      };
    } else if (process.env.OPENAI_API_KEY) {
      const modelId = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
      resolved = { kind: "openai", modelId, label: `OpenAI (${modelId})` };
    } else {
      resolved = { kind: "none", modelId: "", label: "Mode démo (aucun LLM)" };
    }
  }

  cache = { value: resolved, expiresAt: now + CACHE_TTL_MS };
  return resolved;
}

export function createLanguageModel(resolved: ResolvedLlm): LanguageModel | null {
  if (resolved.kind === "none") return null;

  if (resolved.kind === "ollama") {
    const base = resolved.ollamaBaseUrl ?? ollamaBaseUrl();
    const ollamaProvider = createOpenAI({
      baseURL: `${base}/v1`,
      apiKey: "ollama",
    });
    // .chat() force /v1/chat/completions (Ollama ne supporte pas /v1/responses)
    return ollamaProvider.chat(resolved.modelId);
  }

  return openai(resolved.modelId);
}
