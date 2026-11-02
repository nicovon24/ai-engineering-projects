import { EMBEDDING_MODEL_VERSION, embedPassage, embedQuestion } from "./semantic-embedding";
import { expandGroundedNames, isOverviewQuestion, retrievePassages, retrieveWithRewrites, scopeGroundedName } from "./retrieval";
import { readDocumentVectors, saveDocumentVectors } from "./storage";
import type { DocumentRecord, DocumentVectorIndex, Passage, WorkspaceRecord } from "./types";

// The initial threshold admits the synthetic "laburo"/"trabajó" match (0.283)
// while leaving the current unrelated calibration cases empty (all below 0.154).
const MIN_COSINE_SIMILARITY = 0.25;
const FUSION_OFFSET = 60;

function validIndex(index: DocumentVectorIndex | null, document: DocumentRecord): index is DocumentVectorIndex {
  if (!index || index.modelVersion !== EMBEDDING_MODEL_VERSION || index.documentId !== document.id ||
    index.passages.length !== document.passages.length) return false;
  return index.passages.every((item, position) =>
    item.passageId === document.passages[position].id && item.vectors.length > 0 &&
    item.vectors.every((vector) => vector.length === 384 && vector.every(Number.isFinite)));
}

export async function buildDocumentVectorIndex(document: DocumentRecord): Promise<DocumentVectorIndex> {
  const passages: DocumentVectorIndex["passages"] = [];
  for (const passage of document.passages) {
    passages.push({ passageId: passage.id, vectors: await embedPassage(passage.text) });
  }
  return { modelVersion: EMBEDDING_MODEL_VERSION, documentId: document.id, passages };
}

async function workspaceVectors(token: string, workspace: WorkspaceRecord): Promise<Map<string, number[][]>> {
  const vectors = new Map<string, number[][]>();
  for (const document of workspace.documents) {
    let index = await readDocumentVectors(token, document.id).catch(() => null);
    if (!validIndex(index, document)) {
      index = await buildDocumentVectorIndex(document);
      await saveDocumentVectors(token, document, index);
    }
    for (const item of index.passages) vectors.set(item.passageId, item.vectors);
  }
  return vectors;
}

export type PreparedSemanticSearch = {
  queryVector: number[];
  vectors: Map<string, number[][]>;
  passageIds: string[];
};

export async function prepareSemanticSearch(
  token: string,
  workspace: WorkspaceRecord,
  question: string,
): Promise<PreparedSemanticSearch> {
  const queryVector = await embedQuestion(expandGroundedNames(workspace, question));
  const vectors = await workspaceVectors(token, workspace);
  return {
    queryVector,
    vectors,
    passageIds: workspace.documents.flatMap((document) => document.passages.map((passage) => passage.id)),
  };
}

function similarity(left: number[], right: number[]): number {
  return left.reduce((sum, value, index) => sum + value * right[index], 0);
}

function fuse(lexical: Passage[], semantic: Passage[]): Passage[] {
  const scores = new Map<string, { passage: Passage; score: number; order: number }>();
  for (const [ranked, weight] of [[lexical, 1], [semantic, 1]] as const) {
    ranked.forEach((passage, rank) => {
      const current = scores.get(passage.id);
      if (current) current.score += weight / (FUSION_OFFSET + rank + 1);
      else scores.set(passage.id, { passage, score: weight / (FUSION_OFFSET + rank + 1), order: scores.size });
    });
  }
  return [...scores.values()]
    .sort((a, b) => b.score - a.score || a.order - b.order)
    .slice(0, 5)
    .map(({ passage }) => passage);
}

export async function retrieveHybrid(
  workspace: WorkspaceRecord,
  question: string,
  rewrites: string[],
  prepared: PreparedSemanticSearch | null,
): Promise<{ passages: Passage[]; mode: "hybrid" | "lexical_fallback" }> {
  if (workspace.documents.length === 1 && isOverviewQuestion(question)) {
    return { passages: retrievePassages(workspace, question), mode: "hybrid" };
  }
  const scopedWorkspace = scopeGroundedName(workspace, question);
  const lexical = rewrites.length > 0
    ? retrieveWithRewrites(scopedWorkspace, question, rewrites, 20)
    : retrievePassages(scopedWorkspace, question, 20);
  const passages = workspace.documents.flatMap((document) => document.passages);
  if (!prepared || passages.length !== prepared.passageIds.length ||
    passages.some((passage, index) => passage.id !== prepared.passageIds[index])) {
    return { passages: lexical.slice(0, 5), mode: "lexical_fallback" };
  }
  try {
    const semantic = scopedWorkspace.documents.flatMap((document) => document.passages)
      .map((passage) => ({ passage, score: Math.max(...(prepared.vectors.get(passage.id) ?? []).map((vector) => similarity(prepared.queryVector, vector))) }))
      .filter(({ score }) => score >= MIN_COSINE_SIMILARITY)
      .sort((a, b) => b.score - a.score)
      .slice(0, 20)
      .map(({ passage }) => passage);
    return { passages: fuse(lexical, semantic), mode: "hybrid" };
  } catch {
    return { passages: lexical.slice(0, 5), mode: "lexical_fallback" };
  }
}
