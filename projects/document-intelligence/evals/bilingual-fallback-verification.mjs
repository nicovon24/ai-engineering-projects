import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import ts from "typescript";

const projectRoot = path.resolve(import.meta.dirname, "..");
const temporaryRoot = await mkdtemp(path.join(import.meta.dirname, ".bilingual-fallback-"));
const originalFetch = globalThis.fetch;
const originalKey = process.env.GROQ_API_KEY;
const originalBaseUrl = process.env.GROQ_BASE_URL;
const checks = [];

function checked(label, condition) {
  assert.ok(condition, label);
  checks.push(label);
}

function providerResponse(value, status = 200) {
  return new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify(value) } }] }), { status });
}

async function compile(name) {
  const source = await readFile(path.join(projectRoot, "src", "lib", `${name}.ts`), "utf8");
  const output = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
    fileName: `${name}.ts`,
  }).outputText.replaceAll('from "./errors"', 'from "./errors.mjs"');
  await writeFile(path.join(temporaryRoot, `${name}.mjs`), output);
}

try {
  for (const name of ["errors", "answer", "query-rewrite", "retrieval"]) await compile(name);
  const { generateGeneralAnswer } = await import(pathToFileURL(path.join(temporaryRoot, "answer.mjs")));
  const { rewriteSearches } = await import(pathToFileURL(path.join(temporaryRoot, "query-rewrite.mjs")));
  const { retrievePassages, retrieveWithRewrites } = await import(pathToFileURL(path.join(temporaryRoot, "retrieval.mjs")));

  delete process.env.GROQ_API_KEY;
  globalThis.fetch = () => { throw new Error("No provider request expected"); };
  checked("keyless rewrite returns no provider queries", (await rewriteSearches("Where is the budget?", "en")).length === 0);

  process.env.GROQ_API_KEY = "synthetic-key-for-verification";
  process.env.GROQ_BASE_URL = "https://api.groq.com/openai/v1/";
  const calls = [];
  globalThis.fetch = async (url, options) => {
    calls.push({ url, body: JSON.parse(options.body) });
    return providerResponse({ searches: [
      { language: "es", phrase: "presupuesto del proyecto" },
      { language: "en", phrase: "project budget" },
    ] });
  };
  const rewrites = await rewriteSearches("What is the project budget?", "en");
  checked("rewrite returns bounded bilingual searches", rewrites.length === 2 && rewrites.includes("presupuesto del proyecto"));
  checked("rewrite sends the question and locale without source text", calls.length === 1 &&
    calls[0].url === "https://api.groq.com/openai/v1/chat/completions" &&
    calls[0].body.messages[1].content === JSON.stringify({ question: "What is the project budget?", locale: "en" }) &&
    !JSON.stringify(calls[0].body).includes("Private source passage"));
  checked("configured Groq base URL is normalized", calls[0].url === "https://api.groq.com/openai/v1/chat/completions");

  globalThis.fetch = async () => providerResponse({ searches: [
    { language: "es", phrase: "uno" }, { language: "en", phrase: "two" },
    { language: "es", phrase: "three" }, { language: "en", phrase: "four" },
  ] });
  checked("oversized rewrite falls back to lexical search", (await rewriteSearches("question", "en")).length === 0);
  globalThis.fetch = async () => { throw new Error("synthetic provider outage"); };
  checked("rewrite outage falls back to lexical search", (await rewriteSearches("question", "en")).length === 0);

  const passage = { id: "passage-1", documentId: "document-1", text: "El presupuesto aprobado fue 100 pesos.", page: 1, startOffset: 0, endOffset: 41 };
  const workspace = { documents: [{ id: "document-1", name: "plan.pdf", passages: [passage] }] };
  checked("English lexical miss is recovered by Spanish rewrite", retrievePassages(workspace, "What is the budget?").length === 0 &&
    retrieveWithRewrites(workspace, "What is the budget?", ["presupuesto aprobado"])[0]?.id === passage.id);
  checked("combined retrieval keeps at most five passages", retrieveWithRewrites(workspace, "What is the budget?", ["presupuesto aprobado"]).length <= 5);

  const generalCalls = [];
  globalThis.fetch = async (url, options) => {
    generalCalls.push({ url, body: JSON.parse(options.body) });
    return providerResponse({ kind: "general", text: "Photosynthesis converts light into chemical energy." });
  };
  const general = await generateGeneralAnswer("What is photosynthesis?", "en");
  checked("general response uses its own citation-free shape", general.kind === "general" && general.text === "Photosynthesis converts light into chemical energy.");
  checked("general request sends no source passage", generalCalls.length === 1 &&
    generalCalls[0].body.messages[1].content === "What is photosynthesis?" &&
    !JSON.stringify(generalCalls[0].body).includes(passage.text));

  let unsafeCalls = 0;
  globalThis.fetch = async () => { unsafeCalls += 1; return providerResponse({ kind: "general", text: "Your salary is $200,000." }); };
  checked("personal question is refused before model classification", (await generateGeneralAnswer("What is my salary?", "en")).kind === "cannot_verify" && unsafeCalls === 0);
  globalThis.fetch = async () => { unsafeCalls += 1; return providerResponse({ kind: "general", text: "The current price is $123." }); };
  checked("current question is refused before model classification", (await generateGeneralAnswer("What is today's stock price?", "en")).kind === "current_data" && unsafeCalls === 0);
  checked("current office holder is refused before model classification", (await generateGeneralAnswer("Who is Argentina's president?", "en")).kind === "current_data" && unsafeCalls === 0);
  checked("third-person personal salary is refused before model classification", (await generateGeneralAnswer("What is Nicolas's salary?", "en")).kind === "cannot_verify" && unsafeCalls === 0);
  checked("Spanish market value is refused before model classification", (await generateGeneralAnswer("¿Cuánto vale Bitcoin?", "es")).kind === "current_data" && unsafeCalls === 0);
  checked("Spanish personal earnings are refused before model classification", (await generateGeneralAnswer("¿Cuánto cobra Nicolás?", "es")).kind === "cannot_verify" && unsafeCalls === 0);
  checked("ambiguous questions are refused outside conceptual forms", (await generateGeneralAnswer("Tell me about Nicolas", "en")).kind === "cannot_verify" && unsafeCalls === 0);
  checked("named-person question is refused despite conceptual syntax", (await generateGeneralAnswer("What is the favorite color of Nicolas?", "en")).kind === "cannot_verify" && unsafeCalls === 0);
  checked("asset value question is refused despite conceptual syntax", (await generateGeneralAnswer("What is the value of Bitcoin?", "en")).kind === "cannot_verify" && unsafeCalls === 0);
  checked("unknown conceptual topic is refused rather than classified by Groq", (await generateGeneralAnswer("What is comparative mythology?", "en")).kind === "cannot_verify" && unsafeCalls === 0);
  globalThis.fetch = async () => { unsafeCalls += 1; return providerResponse({ kind: "general", text: "According to plan.pdf, page 2, the answer is yes." }); };
  checked("document-specific question is refused before model classification", (await generateGeneralAnswer("What does my file say?", "en")).kind === "cannot_verify" && unsafeCalls === 0);
  globalThis.fetch = async () => providerResponse({ kind: "general", text: "According to plan.pdf, page 2, the answer is yes." });
  checked("general output cannot claim a document source", (await generateGeneralAnswer("Explain photosynthesis", "en")).kind === "cannot_verify");
  globalThis.fetch = async () => providerResponse({ kind: "general", text: "The current price is $123." });
  checked("general output cannot present a live price", (await generateGeneralAnswer("Explain photosynthesis", "en")).kind === "current_data");
  globalThis.fetch = async () => providerResponse({ kind: "general", text: "Argentina's president is X." });
  checked("general output cannot present a current office holder", (await generateGeneralAnswer("Explain photosynthesis", "en")).kind === "current_data");
  globalThis.fetch = async () => providerResponse({ kind: "general", text: "Nicolas earns $200,000." });
  checked("general output cannot present personal earnings", (await generateGeneralAnswer("Explain photosynthesis", "en")).kind === "cannot_verify");
  globalThis.fetch = async () => providerResponse({ kind: "general", text: "Nicolas likes blue." });
  checked("general output must discuss the approved topic", (await generateGeneralAnswer("Explain photosynthesis", "en")).kind === "cannot_verify");
  globalThis.fetch = async () => providerResponse({ kind: "general", text: "According to [1], an answer." });
  checked("general output cannot include a passage marker", (await generateGeneralAnswer("Explain photosynthesis", "en")).kind === "cannot_verify");

  process.stdout.write(`${checks.length}/${checks.length} bilingual fallback checks passed.\n`);
} finally {
  globalThis.fetch = originalFetch;
  if (originalKey === undefined) delete process.env.GROQ_API_KEY;
  else process.env.GROQ_API_KEY = originalKey;
  if (originalBaseUrl === undefined) delete process.env.GROQ_BASE_URL;
  else process.env.GROQ_BASE_URL = originalBaseUrl;
  await rm(temporaryRoot, { recursive: true, force: true });
}
