import type { Passage, WorkspaceRecord } from "./types";

const stopWords = new Set([
  "a", "al", "and", "are", "como", "con", "cuál", "cual", "de", "del", "do", "does",
  "el", "en", "es", "esta", "este", "for", "how", "is", "la", "las", "lo", "los",
  "of", "on", "para", "por", "que", "qué", "se", "the", "to", "un", "una", "what",
  "when", "where", "which", "who", "y",
]);

function terms(input: string): string[] {
  return (input.toLocaleLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").match(/[\p{L}\p{N}]{2,}/gu) ?? [])
    .filter((word) => !stopWords.has(word));
}

export function retrievePassages(workspace: WorkspaceRecord, question: string, limit = 5): Passage[] {
  const queryTerms = [...new Set(terms(question))];
  if (queryTerms.length === 0) return [];

  return workspace.documents
    .flatMap((document) => document.passages.map((passage) => {
      const textTerms = terms(passage.text);
      const termSet = new Set(textTerms);
      const nameTerms = new Set(terms(document.name));
      const matches = queryTerms.filter((term) => termSet.has(term));
      const score = matches.reduce((total, term) => total + 1 + Math.min(textTerms.filter((word) => word === term).length - 1, 2) * 0.25 + (nameTerms.has(term) ? 0.4 : 0), 0);
      return { passage, score, matches: matches.length };
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || b.matches - a.matches)
    .slice(0, limit)
    .map((item) => item.passage);
}
