import { z } from "zod";
import type { Locale } from "./types";

const rewriteSchema = z.object({
  searches: z.array(z.object({
    language: z.enum(["es", "en"]),
    phrase: z.string().trim().min(2).max(120).refine((phrase) =>
      !/[\r\n]/.test(phrase) && phrase.split(/\s+/).length <= 12),
  }).strict()).min(2).max(3),
}).strict().refine(({ searches }) =>
  searches.some(({ language }) => language === "es") &&
  searches.some(({ language }) => language === "en") &&
  new Set(searches.map(({ phrase }) => phrase.toLocaleLowerCase())).size === searches.length,
);

export async function rewriteSearches(question: string, locale: Locale): Promise<string[]> {
  const key = process.env.GROQ_API_KEY;
  if (!key) return [];

  try {
    const response = await fetch(`${(process.env.GROQ_BASE_URL || "https://api.groq.com/openai/v1").replace(/\/+$/, "")}/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL || "openai/gpt-oss-20b",
        temperature: 0,
        max_completion_tokens: 250,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: "Create two or three short lexical search phrases for finding text relevant to the user's question. Include at least one Spanish (es) and one English (en) phrase. Preserve names, dates, and specific terms. Do not answer the question. Return only JSON: {\"searches\":[{\"language\":\"es\",\"phrase\":\"...\"},{\"language\":\"en\",\"phrase\":\"...\"}]}" },
          { role: "user", content: JSON.stringify({ question, locale }) },
        ],
      }),
      signal: AbortSignal.timeout(25_000),
      cache: "no-store",
    });
    if (!response.ok) return [];
    const payload = await response.json() as { choices?: { message?: { content?: string } }[] };
    const content = payload?.choices?.[0]?.message?.content;
    if (!content) return [];
    return rewriteSchema.parse(JSON.parse(content)).searches.map(({ phrase }) => phrase);
  } catch {
    // Rewriting is an optional retrieval aid. Use the original lexical search on any failure.
    return [];
  }
}
