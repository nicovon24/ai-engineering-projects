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

export function isOverviewQuestion(question: string): boolean {
  const normalized = question.toLocaleLowerCase().normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
  return /^(what is (the|this|my) (file|document|pdf) about|what does (the|this|my) (file|document|pdf) (cover|describe)|summari[sz]e (the|this|my) (file|document|pdf)|give me a (summary|overview) of (the|this|my) (file|document|pdf)|de que trata (el|este|mi) (archivo|documento|pdf)|resum(e|i|ime) (el|este|mi) (archivo|documento|pdf)|dame un resumen de (el|este|mi) (archivo|documento|pdf))$/.test(normalized);
}

function representativePassages(passages: Passage[], limit: number): Passage[] {
  const count = Math.max(0, Math.min(Math.floor(limit), passages.length));
  if (count <= 1) return passages.slice(0, count);
  return Array.from({ length: count }, (_, index) =>
    passages[Math.round(index * (passages.length - 1) / (count - 1))]);
}

export function retrievePassages(workspace: WorkspaceRecord, question: string, limit = 5): Passage[] {
  if (workspace.documents.length === 1 && isOverviewQuestion(question)) {
    return representativePassages(workspace.documents[0].passages, limit);
  }
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

export function retrieveWithRewrites(workspace: WorkspaceRecord, question: string, rewrites: string[]): Passage[] {
  const queries = [question, ...rewrites];
  const scores = new Map<string, { passage: Passage; score: number; firstSeen: number }>();
  let firstSeen = 0;
  for (const [queryIndex, query] of queries.entries()) {
    // Search the full bounded workspace so a useful translated hit can compete for the final five slots.
    const ranked = retrievePassages(workspace, query, Number.MAX_SAFE_INTEGER);
    ranked.forEach((passage, rank) => {
      const existing = scores.get(passage.id);
      const score = (queryIndex === 0 ? 2 : 1) / (rank + 1);
      if (existing) existing.score += score;
      else scores.set(passage.id, { passage, score, firstSeen: firstSeen++ });
    });
  }
  return [...scores.values()]
    .sort((a, b) => b.score - a.score || a.firstSeen - b.firstSeen)
    .slice(0, 5)
    .map(({ passage }) => passage);
}
