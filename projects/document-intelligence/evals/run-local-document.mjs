import { readFileSync } from "node:fs";
import { readFile, stat } from "node:fs/promises";
import { registerHooks } from "node:module";
import { extname } from "node:path";
import { performance } from "node:perf_hooks";
import { fileURLToPath } from "node:url";
import ts from "typescript";

// Reuse the application modules directly; Node needs a hook for their TS imports.
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (context.parentURL?.includes("/src/lib/") && specifier.startsWith(".") && !extname(specifier)) {
      return nextResolve(`${specifier}.ts`, context);
    }
    return nextResolve(specifier, context);
  },
  load(url, context, nextLoad) {
    if (url.endsWith(".ts")) {
      return {
        format: "module",
        shortCircuit: true,
        source: ts.transpileModule(readFileSync(fileURLToPath(url), "utf8"), {
          compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
        }).outputText,
      };
    }
    return nextLoad(url, context);
  },
});

function fail(code, caseId) {
  const error = new Error(code);
  error.safeCode = code;
  error.caseId = caseId;
  throw error;
}

function caseReference(index) {
  return `case-${String(index + 1).padStart(3, "0")}`;
}

function options(argv) {
  const result = {};
  for (let index = 0; index < argv.length; index += 2) {
    const flag = argv[index];
    if (!["--file", "--cases"].includes(flag) || result[flag] || !argv[index + 1]) fail("invalid_arguments");
    result[flag] = argv[index + 1];
  }
  if (!result["--file"]) fail("missing_file_argument");
  return result;
}

function validateCases(value) {
  if (!value || typeof value !== "object" || !Array.isArray(value.cases) || value.cases.length === 0) {
    fail("invalid_cases_schema");
  }
  if (value.version !== undefined && (typeof value.version !== "string" || !value.version.trim() || value.version.length > 200)) {
    fail("invalid_cases_schema");
  }
  const ids = new Set();
  for (const [index, item] of value.cases.entries()) {
    const caseId = caseReference(index);
    if (!item || typeof item !== "object" || typeof item.id !== "string" || !item.id.trim() ||
        item.id.length > 200 || ids.has(item.id)) {
      fail("invalid_case_id", caseId);
    }
    ids.add(item.id);
    if (!["es", "en"].includes(item.locale) || typeof item.question !== "string" || !item.question.trim() ||
        !Array.isArray(item.expectedEvidence)) fail("invalid_cases_schema", caseId);
    for (const label of item.expectedEvidence) {
      if (!label || typeof label.contains !== "string" || !label.contains.trim() ||
          (label.page !== undefined && (!Number.isInteger(label.page) || label.page < 1)) ||
          (label.passageIndex !== undefined && (!Number.isInteger(label.passageIndex) || label.passageIndex < 0))) {
        fail("invalid_evidence_label", caseId);
      }
    }
  }
  return value;
}

function mean(values) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
}

function timings(values) {
  if (!values.length) return { median: null, p95: null };
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return {
    median: sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2,
    p95: sorted[Math.ceil(sorted.length * 0.95) - 1],
  };
}

async function main() {
  const args = options(process.argv.slice(2));
  const extension = extname(args["--file"]).slice(1).toLowerCase();
  if (!["pdf", "docx", "txt", "md"].includes(extension)) fail("unsupported_file");
  const { MAX_FILE_BYTES } = await import("../src/lib/limits.ts");
  let size;
  try {
    size = await stat(args["--file"]);
  } catch {
    fail("file_unavailable");
  }
  if (!size.isFile()) fail("file_unavailable");
  if (size.size === 0) fail("empty_file");
  if (size.size > MAX_FILE_BYTES) fail("file_too_large");
  let bytes;
  try {
    bytes = await readFile(args["--file"]);
  } catch {
    fail("file_unavailable");
  }
  // Preserve the format while removing the original name from retrieval scoring.
  const file = new File([bytes], `evaluation.${extension}`);
  const { parseDocument } = await import("../src/lib/parse-document.ts");
  const { retrievePassages } = await import("../src/lib/retrieval.ts");
  let document;
  try {
    document = await parseDocument(file, "local-document");
  } catch (error) {
    fail(typeof error?.code === "string" ? error.code : "parse_failed");
  }
  const report = {
    document: {
      extension: document.extension,
      pageCount: document.pageCount,
      passageCount: document.passages.length,
      characterCount: document.passages.reduce((sum, passage) => sum + passage.text.length, 0),
    },
  };
  if (!args["--cases"]) return report;

  let corpus;
  try {
    corpus = validateCases(JSON.parse((await readFile(args["--cases"], "utf8")).replace(/^\uFEFF/, "")));
  } catch (error) {
    if (error?.safeCode) throw error;
    fail("cases_unavailable_or_invalid_json");
  }
  const workspace = { documents: [document], questions: [], createdAt: "", lastActiveAt: "", expiresAt: "" };
  const results = corpus.cases.map((item, index) => {
    const caseId = caseReference(index);
    const expected = item.expectedEvidence.map((label) => {
      if (label.passageIndex !== undefined) {
        const passage = document.passages[label.passageIndex];
        if (!passage || !passage.text.includes(label.contains) ||
            (label.page !== undefined && passage.page !== label.page)) {
          fail("evidence_label_mismatch", caseId);
        }
        return passage.id;
      }
      const matches = document.passages.filter((passage) =>
        passage.text.includes(label.contains) && (label.page === undefined || passage.page === label.page));
      if (matches.length !== 1) fail("evidence_label_not_unique", caseId);
      return matches[0].id;
    });
    if (new Set(expected).size !== expected.length) fail("duplicate_evidence_label", caseId);
    const start = performance.now();
    const retrieved = retrievePassages(workspace, item.question, 5).map((passage) => passage.id);
    const durationMs = performance.now() - start;
    const hits = expected.filter((id) => retrieved.includes(id)).length;
    return {
      id: caseId,
      locale: item.locale,
      expectedEvidenceCount: expected.length,
      retrievedPassageCount: retrieved.length,
      hitCount: hits,
      recallAt5: expected.length ? hits / expected.length : null,
      annotatedPrecision: expected.length ? hits / (retrieved.length || 1) : null,
      noEvidenceCorrect: expected.length ? null : retrieved.length === 0,
      retrievalDurationMs: durationMs,
    };
  });
  const answerable = results.filter((item) => item.recallAt5 !== null);
  const noEvidence = results.filter((item) => item.noEvidenceCorrect !== null);
  return {
    ...report,
    caseCount: results.length,
    answerableCaseCount: answerable.length,
    noEvidenceCaseCount: noEvidence.length,
    recallAt5: mean(answerable.map((item) => item.recallAt5)),
    annotatedPrecision: mean(answerable.map((item) => item.annotatedPrecision)),
    noEvidenceAccuracy: mean(noEvidence.map((item) => Number(item.noEvidenceCorrect))),
    retrievalDurationMs: timings(results.map((item) => item.retrievalDurationMs)),
    results,
  };
}

try {
  process.stdout.write(`${JSON.stringify(await main(), null, 2)}\n`);
} catch (error) {
  process.stderr.write(`${JSON.stringify({ error: error?.safeCode ?? "evaluation_failed", ...(error?.caseId ? { caseId: error.caseId } : {}) })}\n`);
  process.exitCode = 1;
}
