import { readFile } from "node:fs/promises";
import { performance } from "node:perf_hooks";
import { retrievePassages } from "../src/lib/retrieval.ts";

const corpusPath = new URL("./retrieval-cases.json", import.meta.url);
const corpus = JSON.parse(await readFile(corpusPath, "utf8"));

const documents = corpus.documents.map((document) => ({
  id: document.id,
  name: document.name,
  passages: document.passages.map((passage) => ({
    id: passage.id,
    documentId: document.id,
    text: passage.text,
    page: null,
    startOffset: 0,
    endOffset: passage.text.length,
  })),
}));

const workspace = { documents };
const results = corpus.cases.map((item) => {
  const startedAt = performance.now();
  const actualPassageIds = retrievePassages(workspace, item.question).map((passage) => passage.id);
  const durationMs = performance.now() - startedAt;
  const expected = new Set(item.expectedPassageIds);
  const hits = [...expected].filter((id) => actualPassageIds.includes(id));
  return {
    id: item.id,
    locale: item.locale,
    expectedPassageIds: [...expected],
    actualPassageIds,
    expectedHitRate: expected.size ? hits.length / expected.size : null,
    annotatedPrecision: expected.size ? hits.length / (actualPassageIds.length || 1) : null,
    noEvidenceCorrect: expected.size === 0 ? actualPassageIds.length === 0 : null,
    durationMs,
  };
});

const answerable = results.filter((item) => item.expectedHitRate !== null);
const noEvidence = results.filter((item) => item.noEvidenceCorrect !== null);
const durations = results.map((item) => item.durationMs).sort((a, b) => a - b);
const middle = Math.floor(durations.length / 2);
const output = {
  corpusVersion: corpus.version,
  caseCount: results.length,
  answerableCaseCount: answerable.length,
  noEvidenceCaseCount: noEvidence.length,
  expectedPassageRecallAt5: answerable.reduce((sum, item) => sum + item.expectedHitRate, 0) / answerable.length,
  annotatedPassagePrecision: answerable.reduce((sum, item) => sum + item.annotatedPrecision, 0) / answerable.length,
  noEvidenceEmptyResultRate: noEvidence.filter((item) => item.noEvidenceCorrect).length / noEvidence.length,
  retrievalDurationMs: {
    median: durations.length % 2 ? durations[middle] : (durations[middle - 1] + durations[middle]) / 2,
    p95: durations[Math.ceil(durations.length * 0.95) - 1],
  },
  nodeVersion: process.version,
  results,
};

if (process.argv.includes("--json")) {
  process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
} else {
  console.log(`Corpus ${output.corpusVersion}: ${output.caseCount} cases`);
  console.log(`Expected passage recall@5: ${output.expectedPassageRecallAt5.toFixed(2)} (${answerable.length} answerable cases)`);
  console.log(`Annotated passage precision: ${output.annotatedPassagePrecision.toFixed(2)} (${answerable.length} answerable cases)`);
  console.log(`No-evidence empty-result rate: ${output.noEvidenceEmptyResultRate.toFixed(2)} (${noEvidence.length} cases)`);
  console.log(`Retrieval duration: median ${output.retrievalDurationMs.median.toFixed(3)} ms; p95 ${output.retrievalDurationMs.p95.toFixed(3)} ms (local diagnostic only)`);
  for (const item of results) {
    console.log(`${item.id}: expected=[${item.expectedPassageIds.join(", ")}] actual=[${item.actualPassageIds.join(", ")}]`);
  }
}
