import type { Locale } from "@/lib/contracts";
import type { ToolResult } from "./tools";

export type PlannerDecision =
  | { kind: "tool"; name: string; args: unknown }
  | { kind: "final"; answer: string; noteIds: string[] };

export interface PlannerInput {
  request: string;
  locale: Locale;
  outcomes: readonly ToolResult[];
}

type Topic = "delivery" | "scope" | "unknown";

function topicOf(request: string): Topic {
  const text = request.toLocaleLowerCase().normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[¿?!.]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (text === "cuando se entrega el proyecto faro" || text === "when is project faro due") return "delivery";
  if (text === "que incluye la primera version de faro" || text === "what does the first version of faro include") return "scope";
  return "unknown";
}

function insufficient(locale: Locale): PlannerDecision {
  return {
    kind: "final",
    answer: locale === "es"
      ? "No tengo evidencia suficiente en las notas para responder esa pregunta."
      : "The notes do not provide enough evidence to answer that question.",
    noteIds: [],
  };
}

export function deterministicPlanner({ request, locale, outcomes }: PlannerInput): PlannerDecision {
  const topic = topicOf(request);
  if (topic === "unknown") return insufficient(locale);
  const targetId = topic === "delivery" ? "faro-delivery" : "faro-scope";

  if (outcomes.length === 0) {
    return {
      kind: "tool",
      name: "search_notes",
      args: { query: topic === "delivery" ? "Faro delivery" : "Faro scope", limit: 2 },
    };
  }

  const search = outcomes.find((outcome) => outcome.name === "search_notes");
  if (!search || search.name !== "search_notes" || !search.hits.some((hit) => hit.id === targetId)) {
    return insufficient(locale);
  }

  const read = outcomes.find((outcome) => outcome.name === "read_note");
  if (!read) {
    return { kind: "tool", name: "read_note", args: { note_id: targetId } };
  }
  if (read.name !== "read_note" || read.note.id !== targetId) return insufficient(locale);

  if (topic === "delivery") {
    return {
      kind: "final",
      answer: locale === "es"
        ? "La primera versión del proyecto Faro se entrega el 18 de noviembre de 2026. Ese día se comparte una demo local y una breve nota de traspaso."
        : "The first version of Project Faro is due on 18 November 2026. The team will share a local demo and a short handoff note that day.",
      noteIds: [targetId],
    };
  }
  return {
    kind: "final",
    answer: locale === "es"
      ? "La primera versión de Faro incluye un formulario de preguntas, búsqueda entre dos notas de ejemplo, respuestas con IDs de fuente y una traza visible. La carga de archivos y la búsqueda web quedan fuera de esa versión."
      : "Faro's first version includes a question form, search across two sample notes, answers with source IDs, and a visible execution trace. File uploads and live web search are outside that version.",
    noteIds: [targetId],
  };
}
