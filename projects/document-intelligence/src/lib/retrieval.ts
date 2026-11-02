import type { Passage, WorkspaceRecord } from "./types";

const stopWords = new Set([
  "a", "al", "and", "are", "como", "con", "cuál", "cual", "de", "del", "do", "does",
  "el", "en", "es", "esta", "este", "for", "how", "is", "la", "las", "lo", "los",
  "of", "on", "para", "por", "que", "qué", "quien", "se", "the", "to", "un", "una", "what",
  "when", "where", "which", "who", "y",
]);

function terms(input: string): string[] {
  return (input.toLocaleLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").match(/[\p{L}\p{N}]{2,}/gu) ?? [])
    .filter((word) => !stopWords.has(word));
}

function explicitlyLinksNicoAndNicolas(text: string): boolean {
  const normalized = text.toLocaleLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return /\bnico\b.{0,50}\b(apodo|nickname|short for|abreviatura)\b.{0,50}\bnicolas\b|\bnicolas\b.{0,50}\b(apodado|known as|nickname|apodo)\b.{0,50}\bnico\b|\bnicolas\b.{0,40}\(nico\)/i.test(normalized);
}

function linkedFullName(text: string): string | null {
  if (!explicitlyLinksNicoAndNicolas(text)) return null;
  const match = text.match(/\b(Nicol[aá]s)(?:\s+\(Nico\))?\s+([\p{Lu}][\p{L}]+)/u);
  return match ? `${match[1]} ${match[2]}`.toLocaleLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") : null;
}

export function expandGroundedNames(workspace: WorkspaceRecord, question: string): string {
  const normalized = terms(question);
  if (!normalized.includes("nico")) return question;
  // A literal Nico takes precedence unless a source explicitly links the nickname to Nicolás.
  const literal = workspace.documents.some((document) => document.passages.some((passage) => terms(passage.text).includes("nico")));
  const linked = workspace.documents.some((document) => document.passages.some((passage) => explicitlyLinksNicoAndNicolas(passage.text)));
  if (literal && !linked) {
    return question;
  }
  const mentionsNicolas = workspace.documents.some((document) =>
    document.passages.some((passage) => terms(passage.text).includes("nicolas")));
  return mentionsNicolas ? `${question} Nicolás` : question;
}

export function scopeGroundedName(workspace: WorkspaceRecord, question: string): WorkspaceRecord {
  if (!terms(question).includes("nico")) return workspace;
  const literal = workspace.documents.filter((document) =>
    document.passages.some((passage) => terms(passage.text).includes("nico")));
  if (literal.length > 0) {
    const linkedNames = new Set(workspace.documents.flatMap((document) =>
      document.passages.map((passage) => linkedFullName(passage.text)).filter((name): name is string => Boolean(name))));
    return {
      ...workspace,
      documents: workspace.documents.map((document) => ({
        ...document,
        passages: document.passages.filter((passage) => {
          if (terms(passage.text).includes("nico")) return true;
          const normalized = passage.text.toLocaleLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
          return [...linkedNames].some((name) => new RegExp(`(?:^|[^\\p{L}])${name}(?![\\p{L}])`, "u").test(normalized)) ||
            (document.passages.some((item) => explicitlyLinksNicoAndNicolas(item.text)) &&
              linkedNames.size === 0 && terms(passage.text).includes("nicolas"));
        }),
      })).filter((document) => document.passages.length > 0),
    };
  }
  const named = workspace.documents.filter((document) =>
    document.passages.some((passage) => terms(passage.text).includes("nicolas")));
  return named.length > 0 ? { ...workspace, documents: named } : workspace;
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
  const queryTerms = [...new Set(terms(expandGroundedNames(workspace, question)))];
  if (queryTerms.length === 0) return [];

  return scopeGroundedName(workspace, question).documents
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

export function retrieveWithRewrites(workspace: WorkspaceRecord, question: string, rewrites: string[], limit = 5): Passage[] {
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
    .slice(0, limit)
    .map(({ passage }) => passage);
}
