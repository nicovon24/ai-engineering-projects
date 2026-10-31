import { readFile } from "node:fs/promises";
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
  const actualPassageIds = retrievePassages(workspace, item.question).map((passage) => passage.id);
  const expected = new Set(item.expectedPassageIds);
  const hits = [...expected].filter((id) => actualPassageIds.includes(id));
  return {
    id: item.id,
    locale: item.locale,
    expectedPassageIds: [...expected],
    actualPassageIds,
    expectedHitRate: expected.size ? hits.length / expected.size : null,
    noEvidenceCorrect: expected.size === 0 ? actualPassageIds.length === 0 : null,
  };
});

const answerable = results.filter((item) => item.expectedHitRate !== null);
const noEvidence = results.filter((item) => item.noEvidenceCorrect !== null);
const output = {
  corpusVersion: corpus.version,
  caseCount: results.length,
  answerableCaseCount: answerable.length,
  noEvidenceCaseCount: noEvidence.length,
  expectedPassageRecallAt5: answerable.reduce((sum, item) => sum + item.expectedHitRate, 0) / answerable.length,
  noEvidenceEmptyResultRate: noEvidence.filter((item) => item.noEvidenceCorrect).length / noEvidence.length,
  results,
};

if (process.argv.includes("--json")) {
  process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
} else {
  console.log(`Corpus ${output.corpusVersion}: ${output.caseCount} cases`);
  console.log(`Expected passage recall@5: ${output.expectedPassageRecallAt5.toFixed(2)} (${answerable.length} answerable cases)`);
  console.log(`No-evidence empty-result rate: ${output.noEvidenceEmptyResultRate.toFixed(2)} (${noEvidence.length} cases)`);
  for (const item of results) {
    console.log(`${item.id}: expected=[${item.expectedPassageIds.join(", ")}] actual=[${item.actualPassageIds.join(", ")}]`);
  }
}
