import assert from "node:assert/strict";
import test from "node:test";
import { completeJson, GroqError } from "../src/lib/server/groq.ts";

const input = {
  locale: "es",
  systemInstruction: "Summarize the decision request as JSON.",
  payload: { proposal: "A fictional proposal." },
  maxTokens: 300,
};

function configured(transport, config = {}) {
  return { ...input, config: { apiKey: "test-key", ...config }, transport };
}

function response(content, status = 200) {
  return new Response(JSON.stringify({ choices: [{ message: { content } }] }), { status });
}

async function rejectsCode(promise, code) {
  await assert.rejects(promise, (error) => error instanceof GroqError && error.code === code && !error.message.includes("test-key"));
}

test("a missing key fails before fetch", async () => {
  let called = false;
  await rejectsCode(completeJson({ ...input, config: { apiKey: "" }, transport: async () => { called = true; throw Error("unexpected"); } }), "provider_not_configured");
  assert.equal(called, false);
});

test("uses call-time configuration, Spanish locale, and bounded JSON request", async () => {
  let request;
  const result = await completeJson(configured(async (url, options) => {
    request = { url, options };
    return response('{"summary":"Pilot"}');
  }, { model: "test-model", baseUrl: "https://provider.example/v1/" }));
  assert.deepEqual(result, { summary: "Pilot" });
  assert.equal(request.url, "https://provider.example/v1/chat/completions");
  assert.equal(request.options.method, "POST");
  assert.equal(request.options.cache, "no-store");
  assert.equal(request.options.headers.Authorization, "Bearer test-key");
  assert.equal(request.options.headers["Content-Type"], "application/json");
  assert.ok(request.options.signal instanceof AbortSignal);
  const body = JSON.parse(request.options.body);
  assert.equal(body.model, "test-model");
  assert.equal(body.reasoning_effort, undefined);
  assert.equal(body.temperature, 0);
  assert.equal(body.max_completion_tokens, 300);
  assert.deepEqual(body.response_format, { type: "json_object" });
  assert.match(body.messages[0].content, /Spanish \(es\)/);
  assert.match(body.messages[0].content, /untrusted/i);
  assert.deepEqual(JSON.parse(body.messages[1].content), { locale: "es", payload: input.payload });
});

test("English locale is explicit", async () => {
  await completeJson({ ...configured(async (_url, options) => {
    const body = JSON.parse(options.body);
    assert.match(body.messages[0].content, /English \(en\)/);
    assert.equal(JSON.parse(body.messages[1].content).locale, "en");
    return response("{}");
  }), locale: "en" });
});

test("known GPT OSS models receive strict JSON schema and other models fall back to JSON object", async () => {
  const schema = { name: "test_shape", schema: { type: "object", properties: { value: { type: "string" } }, required: ["value"], additionalProperties: false } };
  await completeJson({ ...configured(async (_url, options) => {
    const body = JSON.parse(options.body);
    assert.deepEqual(body.response_format, { type: "json_schema", json_schema: { ...schema, strict: true } });
    return response('{"value":"ok"}');
  }, { model: "openai/gpt-oss-20b" }), schema });
  await completeJson({ ...configured(async (_url, options) => {
    assert.deepEqual(JSON.parse(options.body).response_format, { type: "json_object" });
    return response('{"value":"ok"}');
  }, { model: "other-model" }), schema });
});

test("reads environment settings at call time and applies provider defaults", async () => {
  const saved = Object.fromEntries(["GROQ_API_KEY", "GROQ_MODEL", "GROQ_BASE_URL"].map((name) => [name, process.env[name]]));
  try {
    process.env.GROQ_API_KEY = "first-key";
    delete process.env.GROQ_MODEL;
    delete process.env.GROQ_BASE_URL;
    await completeJson({ ...input, transport: async (url, options) => {
      assert.equal(url, "https://api.groq.com/openai/v1/chat/completions");
      assert.equal(options.headers.Authorization, "Bearer first-key");
      assert.equal(JSON.parse(options.body).model, "openai/gpt-oss-20b");
      assert.equal(JSON.parse(options.body).reasoning_effort, "low");
      return response("{}");
    } });
    process.env.GROQ_API_KEY = "second-key";
    await completeJson({ ...input, transport: async (_url, options) => {
      assert.equal(options.headers.Authorization, "Bearer second-key");
      return response("{}");
    } });
  } finally {
    for (const [name, value] of Object.entries(saved)) {
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
  }
});

test("maps rate limits and other HTTP failures without exposing provider response", async () => {
  await rejectsCode(completeJson(configured(async () => new Response("secret provider body", { status: 429 }))), "provider_limited");
  await rejectsCode(completeJson(configured(async () => new Response("secret provider body", { status: 503 }))), "provider_unavailable");
});

test("rejects malformed envelopes, missing content, and malformed JSON", async () => {
  for (const providerResponse of [
    new Response("not json"),
    new Response(JSON.stringify({ choices: [] })),
    response("not json"),
    response("[]"),
  ]) {
    await rejectsCode(completeJson(configured(async () => providerResponse)), "provider_invalid_output");
  }
});

test("maps transport failures and timeouts to unavailable", async () => {
  await rejectsCode(completeJson(configured(async () => { throw Error("private network detail"); })), "provider_unavailable");
  await rejectsCode(completeJson(configured((_url, options) => new Promise((_resolve, reject) => {
    options.signal.addEventListener("abort", () => reject(options.signal.reason), { once: true });
  }), { timeoutMs: 5 })), "provider_unavailable");
});

test("bounds caller input and provider output", async () => {
  await assert.rejects(completeJson({ ...configured(async () => response("{}")), maxTokens: 0 }), RangeError);
  await assert.rejects(completeJson({ ...configured(async () => response("{}")), payload: { text: "x".repeat(100_001) } }), RangeError);
  await rejectsCode(completeJson(configured(async () => response(JSON.stringify({ text: "x".repeat(1_000_001) })))), "provider_invalid_output");
});
