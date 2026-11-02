import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { handleReviewRequest } from "../src/lib/server/service.ts";

const base = "http://localhost:3301/api/reviews";
function request(method, suffix = "", body, headers = {}) {
  return new Request(`${base}${suffix}`, { method, headers: body === undefined ? headers : { "Content-Type": "application/json", ...headers }, body: body === undefined ? undefined : JSON.stringify(body) });
}
async function call(method, id, action, body, model, headers) {
  const response = await handleReviewRequest(request(method, `${id ? `/${id}` : ""}${action ? `/${action}` : ""}`, body, headers), id, action, model);
  return [response.status, await response.json(), response.headers.get("Cache-Control")];
}

test("create, consent, chat, edit, list, read, and reject cross-origin mutations", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "dpr-service-"));
  const before = process.env.DPR_DATA_DIR;
  process.env.DPR_DATA_DIR = directory;
  try {
    let [status, body, cache] = await call("POST", undefined, undefined, { locale: "es" });
    assert.equal(status, 201);
    assert.equal(cache, "no-store");
    const id = body.review.id;
    assert.equal(body.review.consentAt, undefined);
    [status, body] = await call("POST", id, "chat", { message: "Help me" }, async () => { throw Error("must not call"); });
    assert.equal(body.error, "consent_required");
    [status, body] = await call("PATCH", id, undefined, { consent: true, proposal: { title: "Pilot", summary: "Try a support pilot." } });
    assert.equal(status, 200);
    assert.ok(body.review.consentAt);
    [status, body] = await call("POST", id, "chat", { message: "What is missing?" }, async input => {
      assert.equal(input.locale, "es");
      return { message: "Please provide sources.", proposal: { title: "Pilot", summary: "Try a support pilot." } };
    });
    assert.equal(status, 200);
    assert.equal(body.review.messages.length, 2);
    [status, body] = await call("GET", id);
    assert.equal(body.review.messages.length, 2);
    [status, body] = await call("GET");
    assert.equal(body.reviews.length, 1);
    [status, body] = await call("PATCH", id, undefined, { locale: "en" }, undefined, { Origin: "https://evil.example" });
    assert.equal(status, 403);
    [status] = await call("GET", id, undefined, undefined, undefined, { Host: "evil.example" });
    assert.equal(status, 403, "Foreign browser authority cannot read local records");
    [status] = await call("PATCH", id, undefined, { locale: "es" }, undefined, { Origin: "http://evil.example", Host: "evil.example" });
    assert.equal(status, 403, "Matching foreign Origin and Host must not bypass the local boundary");
    assert.equal(body.error, "forbidden_origin");
    [status, body] = await call("GET", id);
    assert.equal(body.review.locale, "es");
    [status] = await call("PATCH", id, undefined, { locale: "en" }, undefined, { Origin: "http://127.0.0.1:3301", Host: "127.0.0.1:3301", "Sec-Fetch-Site": "same-origin" });
    assert.equal(status, 200, "Next internal URL may differ from the browser Host");
    [status] = await call("PATCH", id, undefined, { locale: "es" }, undefined, { Origin: "http://evil.example", Host: "127.0.0.1:3301" });
    assert.equal(status, 403);
  } finally {
    if (before === undefined) delete process.env.DPR_DATA_DIR; else process.env.DPR_DATA_DIR = before;
    await rm(directory, { recursive: true, force: true });
  }
});

test("source intake, staged generation retry, decision correction, and deletion", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "dpr-service-"));
  const before = process.env.DPR_DATA_DIR;
  process.env.DPR_DATA_DIR = directory;
  try {
    const created = (await call("POST", undefined, undefined, { locale: "en" }))[1].review;
    const id = created.id;
    await call("PATCH", id, undefined, { consent: true, proposal: { title: "Pilot", summary: "Try a support pilot." } });
    let [status, body] = await call("POST", id, "sources", { title: "Observation", text: "Twenty-four requests fit the pilot categories." });
    assert.equal(status, 200);
    assert.equal(body.review.sources.length, 1);
    [status, body] = await call("POST", id, "generate", {}, async () => ({ claims: [{ text: "24 requests fit the pilot.", kind: "factual" }] }));
    assert.equal(body.review.stage, "claims");
    [status, body] = await call("PATCH", id, undefined, { locale: "es" });
    assert.equal(status, 409);
    assert.equal(body.error, "invalid_stage");
    [status, body] = await call("POST", id, "sources", { title: "Late", text: "Too late" });
    assert.equal(body.error, "invalid_stage");
    [status, body] = await call("POST", id, "generate", {}, async () => { throw Error("provider secret"); });
    assert.equal(body.error, "provider_unavailable");
    [status, body] = await call("GET", id);
    assert.equal(body.review.stage, "claims");
    const outputs = [
      { arguments: [{ text: "The pilot covers sampled requests.", claims: [{ text: "24 requests fit the pilot.", kind: "factual" }] }] },
      { arguments: [] },
      { verdicts: [{ claimId: "claim-1", status: "supported", supportingPassageIds: [body.review.sources[0].passages[0].id], contradictingPassageIds: [], rationale: "The note states the count." }] },
      { summary: "The pilot is promising.", questions: [{ question: "What does it cost?", neededEvidence: "Cost analysis." }] },
    ];
    for (const expected of ["supporting", "opposing", "evidence", "synthesis", "complete"]) {
      [status, body] = await call("POST", id, "generate", {}, async () => outputs.shift());
      assert.equal(body.review.stage, expected);
    }
    [status, body] = await call("POST", id, "decision", { outcome: "defer", rationale: "Need costs", conditions: "Get estimate" });
    assert.equal(status, 200);
    const snapshotId = body.review.snapshotId;
    assert.equal(body.review.decision.evidenceSnapshotId, snapshotId);
    [status, body] = await call("POST", id, "decision", { outcome: "approve", rationale: "Costs supplied", conditions: "" });
    assert.equal(body.review.decision.outcome, "approve");
    [status, body] = await call("DELETE", id);
    assert.equal(status, 200);
    assert.equal(body.ok, true);
    [status, body] = await call("GET", id);
    assert.equal(status, 404);
    assert.equal(body.error, "not_found");
  } finally {
    if (before === undefined) delete process.env.DPR_DATA_DIR; else process.env.DPR_DATA_DIR = before;
    await rm(directory, { recursive: true, force: true });
  }
});

test("rejects invalid request bodies and missing decision snapshot", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "dpr-service-"));
  const before = process.env.DPR_DATA_DIR;
  process.env.DPR_DATA_DIR = directory;
  try {
    let [status, body] = await call("POST", undefined, undefined, { locale: "fr" });
    assert.equal(status, 400);
    assert.equal(body.error, "invalid_input");
    const id = (await call("POST", undefined, undefined, { locale: "es" }))[1].review.id;
    [status, body] = await call("POST", id, "decision", { outcome: "approve", rationale: "Yes" });
    assert.equal(body.error, "invalid_stage");
    [status, body] = await call("POST", id, "chat", { message: "x".repeat(6001) });
    assert.equal(body.error, "invalid_input");
  } finally {
    if (before === undefined) delete process.env.DPR_DATA_DIR; else process.env.DPR_DATA_DIR = before;
    await rm(directory, { recursive: true, force: true });
  }
});

test("accepts bounded multipart text files and rejects cross-site fetch metadata", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "dpr-service-"));
  const before = process.env.DPR_DATA_DIR;
  process.env.DPR_DATA_DIR = directory;
  try {
    const id = (await call("POST", undefined, undefined, { locale: "es" }))[1].review.id;
    const form = new FormData();
    form.set("title", "Uploaded note");
    form.set("file", new File(["A synthetic observation."], "note.txt", { type: "text/plain" }));
    const response = await handleReviewRequest(new Request(`${base}/${id}/sources`, { method: "POST", body: form }), id, "sources");
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.review.sources[0].title, "Uploaded note");
    assert.equal(body.review.sources[0].format, "txt");
    const [status, blocked] = await call("PATCH", id, undefined, { locale: "en" }, undefined, { "Sec-Fetch-Site": "cross-site" });
    assert.equal(status, 403);
    assert.equal(blocked.error, "forbidden_origin");
  } finally {
    if (before === undefined) delete process.env.DPR_DATA_DIR; else process.env.DPR_DATA_DIR = before;
    await rm(directory, { recursive: true, force: true });
  }
});
