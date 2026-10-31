import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { registerHooks } from "node:module";
import { extname } from "node:path";
import { performance } from "node:perf_hooks";
import { fileURLToPath } from "node:url";
import ts from "typescript";

// The app uses extensionless imports and parameter properties; transpile only its TS modules.
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (context.parentURL?.includes("/src/lib/") && specifier.startsWith(".") && !extname(specifier)) {
      return nextResolve(`${specifier}.ts`, context);
    }
    return nextResolve(specifier, context);
  },
  load(url, context, nextLoad) {
    if (url.endsWith(".ts")) {
      const source = readFileSync(fileURLToPath(url), "utf8");
      return {
        format: "module",
        shortCircuit: true,
        source: ts.transpileModule(source, {
          compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
        }).outputText,
      };
    }
    return nextLoad(url, context);
  },
});

const { parseDocument } = await import("../src/lib/parse-document.ts");
const { retrievePassages } = await import("../src/lib/retrieval.ts");
const corpus = JSON.parse(await readFile(new URL("./parsed-retrieval-cases.json", import.meta.url), "utf8"));

const documents = [];
const provenance = [];
for (const spec of corpus.documents) {
  const fixtureUrl = new URL(`./fixtures/formats/${spec.fixture}`, import.meta.url);
  const bytes = await readFile(fixtureUrl).catch((error) => {
    if (error.code === "ENOENT") throw new Error("Run python evals/generate_format_fixtures.py before the parsed retrieval evaluation.");
    throw error;
  });
  const file = new File([bytes], spec.fixture);
  const first = await parseDocument(file, spec.id);
  const again = await parseDocument(file, spec.id);
  assert.equal(first.pageCount, spec.expectedPageCount, `${spec.id}: page count`);
  assert.ok(first.passages.length > 0, `${spec.id}: no parsed passages`);
  assert.deepEqual(first.passages, again.passages, `${spec.id}: unstable passage IDs or offsets`);
  assert.ok(first.passages.some((passage) => passage.text.includes(spec.expectedText)), `${spec.id}: expected text missing`);
  for (const passage of first.passages) {
    assert.equal(passage.documentId, spec.id, `${spec.id}: document provenance`);
    assert.equal(passage.page, spec.expectedPage, `${spec.id}: page provenance`);
    assert.match(passage.id, /^[a-f0-9]{24}$/, `${spec.id}: passage ID format`);
    assert.ok(passage.startOffset >= 0 && passage.endOffset > passage.startOffset, `${spec.id}: offsets`);
    assert.equal(passage.endOffset - passage.startOffset, passage.text.length, `${spec.id}: offset length`);
  }
  documents.push(first);
  provenance.push({
    documentId: first.id,
    fixture: spec.fixture,
    extension: first.extension,
    pageCount: first.pageCount,
    passageCount: first.passages.length,
    passages: first.passages.map(({ id, page, startOffset, endOffset, text }) => ({
      id, page, startOffset, endOffset, text,
    })),
  });
}

const workspace = { documents, questions: [], createdAt: "", lastActiveAt: "", expiresAt: "" };
const results = corpus.cases.map((item) => {
  assert.ok(item.locale === "es" || item.locale === "en", `${item.id}: invalid locale`);
  const expectedPassageIds = item.expectedEvidence.map(({ documentId, contains }) => {
    const matches = documents.flatMap((document) => document.passages)
      .filter((passage) => passage.documentId === documentId && passage.text.includes(contains));
    assert.equal(matches.length, 1, `${item.id}: evidence label must resolve to exactly one parsed passage`);
    return matches[0].id;
  });
  assert.equal(new Set(expectedPassageIds).size, expectedPassageIds.length, `${item.id}: duplicate evidence label`);
  const startedAt = performance.now();
  const actualPassageIds = retrievePassages(workspace, item.question).map((passage) => passage.id);
  const durationMs = performance.now() - startedAt;
  const hits = expectedPassageIds.filter((id) => actualPassageIds.includes(id)).length;
  return {
    id: item.id,
    locale: item.locale,
    expectedPassageIds,
    actualPassageIds,
    expectedHitRate: expectedPassageIds.length ? hits / expectedPassageIds.length : null,
    annotatedPrecision: expectedPassageIds.length ? hits / (actualPassageIds.length || 1) : null,
    noEvidenceCorrect: expectedPassageIds.length ? null : actualPassageIds.length === 0,
    durationMs,
  };
});

const answerable = results.filter((item) => item.expectedHitRate !== null);
const noEvidence = results.filter((item) => item.noEvidenceCorrect !== null);
const durations = results.map((item) => item.durationMs).sort((a, b) => a - b);
const middle = Math.floor(durations.length / 2);
const mean = (values) => values.reduce((sum, value) => sum + value, 0) / values.length;
const output = {
  corpusVersion: corpus.version,
  fixtureType: "generated synthetic PDF and DOCX",
  documentCount: documents.length,
  passageCount: documents.reduce((sum, document) => sum + document.passages.length, 0),
  caseCount: results.length,
  answerableCaseCount: answerable.length,
  noEvidenceCaseCount: noEvidence.length,
  expectedPassageRecallAt5: mean(answerable.map((item) => item.expectedHitRate)),
  annotatedPassagePrecision: mean(answerable.map((item) => item.annotatedPrecision)),
  noEvidenceEmptyResultRate: mean(noEvidence.map((item) => Number(item.noEvidenceCorrect))),
  retrievalDurationMs: {
    median: durations.length % 2 ? durations[middle] : (durations[middle - 1] + durations[middle]) / 2,
    p95: durations[Math.ceil(durations.length * 0.95) - 1],
  },
  nodeVersion: process.version,
  provenance,
  results,
};

if (process.argv.includes("--json")) {
  process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
} else {
  console.log(`Parsed corpus ${output.corpusVersion}: ${output.documentCount} documents, ${output.passageCount} passages, ${output.caseCount} cases`);
  console.log(`Expected passage recall@5: ${output.expectedPassageRecallAt5.toFixed(2)} (${answerable.length} answerable cases)`);
  console.log(`Annotated passage precision: ${output.annotatedPassagePrecision.toFixed(2)} (${answerable.length} answerable cases)`);
  console.log(`No-evidence empty-result rate: ${output.noEvidenceEmptyResultRate.toFixed(2)} (${noEvidence.length} cases)`);
  console.log(`Retrieval duration: median ${output.retrievalDurationMs.median.toFixed(3)} ms; p95 ${output.retrievalDurationMs.p95.toFixed(3)} ms (local diagnostic)`);
  for (const item of provenance) {
    console.log(`${item.fixture}: pageCount=${item.pageCount}, passages=${item.passageCount}, provenance=${item.passages.map((passage) => `${passage.id}:page=${passage.page}:offsets=${passage.startOffset}-${passage.endOffset}`).join(", ")}`);
  }
  for (const item of results) {
    console.log(`${item.id}: expected=[${item.expectedPassageIds.join(", ")}] actual=[${item.actualPassageIds.join(", ")}]`);
  }
}
