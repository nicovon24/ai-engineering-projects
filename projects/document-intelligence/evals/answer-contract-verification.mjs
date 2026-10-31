import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import ts from "typescript";

const projectRoot = path.resolve(import.meta.dirname, "..");
const temporaryRoot = await mkdtemp(path.join(import.meta.dirname, ".answer-contract-"));
const originalFetch = globalThis.fetch;
const originalKey = process.env.GROQ_API_KEY;
const originalModel = process.env.GROQ_MODEL;
const results = [];
const passages = [
  { id: "passage-a", documentId: "document-a", text: "The launch was in May.", page: 2, startOffset: 0, endOffset: 22 },
  { id: "passage-b", documentId: "document-b", text: "The budget was 100 pesos.", page: null, startOffset: 0, endOffset: 25 },
];

function checked(name, condition) {
  assert.ok(condition, name);
  results.push(name);
}

async function expectCode(name, operation, code) {
  await assert.rejects(operation, (error) => error?.code === code);
  results.push(name);
}

function providerResponse(answer, status = 200) {
  return new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify(answer) } }] }), { status });
}

function mockFetch(reply) {
  let requests = 0;
  let lastRequest;
  globalThis.fetch = async (url, options) => {
    requests += 1;
    lastRequest = { url, options };
    return typeof reply === "function" ? reply() : reply;
  };
  return { get requests() { return requests; }, get lastRequest() { return lastRequest; } };
}

async function compileAnswer() {
  for (const name of ["errors", "answer"]) {
    const source = await readFile(path.join(projectRoot, "src", "lib", `${name}.ts`), "utf8");
    const output = ts.transpileModule(source, {
      compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
      fileName: `${name}.ts`,
    }).outputText.replaceAll('from "./errors"', 'from "./errors.mjs"');
    await writeFile(path.join(temporaryRoot, `${name}.mjs`), output);
  }
}

try {
  await compileAnswer();
  const { generateAnswer } = await import(pathToFileURL(path.join(temporaryRoot, "answer.mjs")));
  delete process.env.GROQ_API_KEY;
  const noPassages = mockFetch(() => { throw new Error("Network access forbidden"); });
  checked("no passages returns insufficient evidence without a provider request",
    JSON.stringify(await generateAnswer("When was launch?", "en", [])) ===
      JSON.stringify({ status: "insufficient_evidence", claims: [] }) && noPassages.requests === 0);
  checked("passages without a key return evidence only without a provider request",
    JSON.stringify(await generateAnswer("When was launch?", "en", passages)) ===
      JSON.stringify({ status: "evidence_only", claims: [] }) && noPassages.requests === 0);

  process.env.GROQ_API_KEY = "synthetic-key-for-local-verification";
  delete process.env.GROQ_MODEL;
  const emptyWithKey = mockFetch(() => { throw new Error("Network access forbidden"); });
  checked("no passages remain insufficient evidence when a key is configured",
    (await generateAnswer("When was launch?", "en", [])).status === "insufficient_evidence" && emptyWithKey.requests === 0);
  const answered = { status: "answered", claims: [{ text: "The launch was in May.", passageIds: ["passage-a"] }] };
  const valid = mockFetch(providerResponse(answered));
  checked("valid structured answer keeps a known cited passage",
    JSON.stringify(await generateAnswer("When was launch?", "en", passages)) === JSON.stringify(answered));
  mockFetch(providerResponse({ status: "answered", claims: [{ text: "  The launch was in May.  ", passageIds: ["passage-a"] }] }));
  checked("valid claim text is trimmed before return",
    (await generateAnswer("When was launch?", "en", passages)).claims[0].text === "The launch was in May.");
  const body = JSON.parse(valid.lastRequest.options.body);
  checked("provider request explicitly carries selected English locale, question, and retrieved passages",
    valid.lastRequest.url === "https://api.groq.com/openai/v1/chat/completions" &&
    body.messages[0].content.includes("English (en)") &&
    body.messages[1].content.includes("When was launch?") &&
    body.messages[1].content.includes("PASSAGE_ID: passage-a") &&
    body.messages[1].content.includes("PASSAGE_ID: passage-b") &&
    valid.lastRequest.options.cache === "no-store");
  const spanish = mockFetch(providerResponse({ status: "insufficient_evidence", claims: [] }));
  checked("selected Spanish locale and provider refusal return insufficient evidence",
    (await generateAnswer("¿Cuándo fue?", "es", passages)).status === "insufficient_evidence" &&
    JSON.parse(spanish.lastRequest.options.body).messages[0].content.includes("Spanish (es)"));

  mockFetch(providerResponse({ status: "answered", claims: [{ text: "Invented", passageIds: ["unknown-id"] }] }));
  await expectCode("unknown passage ID is rejected", () => generateAnswer("When was launch?", "en", passages), "provider_invalid_answer");
  mockFetch(providerResponse({ status: "answered", claims: [{ text: "Invented", passageIds: ["passage-a", "unknown-id"] }] }));
  await expectCode("mixed valid and unknown passage IDs are rejected", () => generateAnswer("When was launch?", "en", passages), "provider_invalid_answer");
  mockFetch(providerResponse({ status: "answered", claims: [] }));
  await expectCode("answered status with no claims is rejected", () => generateAnswer("When was launch?", "en", passages), "provider_invalid_answer");
  mockFetch(providerResponse({ status: "answered", claims: [{ text: "   ", passageIds: ["passage-a"] }] }));
  await expectCode("whitespace-only claim text is rejected", () => generateAnswer("When was launch?", "en", passages), "provider_invalid_answer");
  mockFetch(providerResponse({ status: "insufficient_evidence", claims: [{ text: "Contradiction", passageIds: ["passage-a"] }] }));
  await expectCode("insufficient evidence with claims is rejected", () => generateAnswer("When was launch?", "en", passages), "provider_invalid_answer");
  mockFetch(providerResponse({ status: "ok", claims: [] }));
  await expectCode("unsupported provider status is rejected", () => generateAnswer("When was launch?", "en", passages), "provider_invalid_answer");
  mockFetch(new Response("null", { status: 200 }));
  await expectCode("null provider envelope is rejected", () => generateAnswer("When was launch?", "en", passages), "provider_invalid_answer");
  mockFetch(new Response("{broken", { status: 200 }));
  await expectCode("malformed provider envelope JSON is rejected", () => generateAnswer("When was launch?", "en", passages), "provider_invalid_answer");
  mockFetch(new Response(JSON.stringify({ choices: [{ message: { content: "{broken" } }] }), { status: 200 }));
  await expectCode("malformed model content JSON is rejected", () => generateAnswer("When was launch?", "en", passages), "provider_invalid_answer");
  mockFetch(new Response("", { status: 429 }));
  await expectCode("provider 429 returns rate limit error", () => generateAnswer("When was launch?", "en", passages), "provider_limited");
  mockFetch(new Response("", { status: 503 }));
  await expectCode("provider 503 returns unavailable error", () => generateAnswer("When was launch?", "en", passages), "provider_unavailable");
  mockFetch(() => { throw new Error("Synthetic transport failure"); });
  await expectCode("transport failure returns unavailable error", () => generateAnswer("When was launch?", "en", passages), "provider_unavailable");
  console.log(`Answer contract verification passed: ${results.length} checks.`);
  for (const result of results) console.log(`- ${result}`);
} finally {
  globalThis.fetch = originalFetch;
  if (originalKey === undefined) delete process.env.GROQ_API_KEY;
  else process.env.GROQ_API_KEY = originalKey;
  if (originalModel === undefined) delete process.env.GROQ_MODEL;
  else process.env.GROQ_MODEL = originalModel;
  await rm(temporaryRoot, { recursive: true, force: true });
}
