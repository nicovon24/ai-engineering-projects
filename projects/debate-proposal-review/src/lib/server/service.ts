import { parseSource, IntakeError } from "./intake.ts";
import { createReview, deleteReview, getReview, listReviews, StorageError, updateReview } from "./storage.ts";
import { advanceReview, chatTurn, WorkflowError } from "./workflow.ts";
import type { WorkflowModel } from "./workflow.ts";
import { completeJson } from "./groq.ts";
import type { Locale, Proposal, ReviewRecord } from "../types.ts";

type ApiErrorCode = "invalid_input" | "invalid_stage" | "too_large" | "forbidden_origin" | "not_found" | "invalid_id" | "storage_error" | "unsupported_action";
class ApiError extends Error {
  readonly code: ApiErrorCode;
  readonly status: number;
  constructor(code: ApiErrorCode, status = 400) {
    super(code);
    this.code = code;
    this.status = status;
  }
}

function json(body: unknown, status = 200): Response {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store", "Content-Type": "application/json" } });
}

function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new ApiError("invalid_input");
  return value as Record<string, unknown>;
}

function boundedText(value: unknown, max: number): string {
  if (typeof value !== "string" || !value.trim() || value.length > max) throw new ApiError("invalid_input");
  return value.trim();
}

function locale(value: unknown): Locale {
  if (value !== "es" && value !== "en") throw new ApiError("invalid_input");
  return value;
}

function proposal(value: unknown): Proposal {
  const entry = object(value);
  return { title: boundedText(entry.title, 160), summary: boundedText(entry.summary, 12000) };
}

function checkOrigin(request: Request): void {
  const site = request.headers.get("sec-fetch-site");
  if (site === "cross-site") throw new ApiError("forbidden_origin", 403);
  const origin = request.headers.get("origin");
  const url = new URL(request.url);
  // Next can normalize the internal URL to localhost; Host retains the browser authority.
  const host = request.headers.get("host") ?? url.host;
  if (!/^(?:127\.0\.0\.1|localhost)(?::[0-9]{1,5})?$/i.test(host)) throw new ApiError("forbidden_origin", 403);
  if (origin && origin !== `${url.protocol}//${host}`) throw new ApiError("forbidden_origin", 403);
}

async function bytes(request: Request, max: number): Promise<Uint8Array> {
  const length = Number(request.headers.get("content-length"));
  if (Number.isFinite(length) && length > max) throw new ApiError("too_large", 413);
  if (!request.body) return new Uint8Array();
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > max) throw new ApiError("too_large", 413);
      chunks.push(value);
    }
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError("invalid_input");
  } finally {
    reader.releaseLock();
  }
  const result = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) { result.set(chunk, offset); offset += chunk.byteLength; }
  return result;
}

async function readJson(request: Request): Promise<Record<string, unknown>> {
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) throw new ApiError("invalid_input");
  const body = await bytes(request, 128 * 1024);
  try { return object(JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(body))); }
  catch (error) { if (error instanceof ApiError) throw error; throw new ApiError("invalid_input"); }
}

function draft(record: ReviewRecord): void {
  if (record.stage !== "draft") throw new ApiError("invalid_stage", 409);
}

function failure(error: unknown): Response {
  if (error instanceof ApiError) return json({ error: error.code }, error.status);
  if (error instanceof WorkflowError) {
    const status = error.code === "invalid_stage" ? 409 : error.code === "consent_required" ? 403 : error.code === "provider_limited" ? 429 : error.code.startsWith("provider_") ? 503 : 400;
    return json({ error: error.code }, status);
  }
  if (error instanceof StorageError) {
    const code = error.code === "NOT_FOUND" ? "not_found" : error.code === "INVALID_ID" ? "invalid_id" : "storage_error";
    return json({ error: code }, code === "not_found" ? 404 : code === "invalid_id" ? 400 : 500);
  }
  if (error instanceof IntakeError) {
    return json({ error: error.code.toLowerCase() }, error.code === "TOO_LARGE" ? 413 : 400);
  }
  return json({ error: "storage_error" }, 500);
}

async function addSource(request: Request, id: string): Promise<ReviewRecord> {
  const contentType = request.headers.get("content-type")?.toLowerCase() ?? "";
  let input: { title?: string; text?: string; filename?: string; bytes?: Uint8Array };
  if (contentType.startsWith("multipart/form-data")) {
    const raw = await bytes(request, 6 * 1024 * 1024);
    const body = new ArrayBuffer(raw.byteLength);
    new Uint8Array(body).set(raw);
    const formRequest = new Request(request.url, { method: "POST", headers: { "Content-Type": request.headers.get("content-type") ?? "" }, body });
    let form: FormData;
    try { form = await formRequest.formData(); } catch { throw new ApiError("invalid_input"); }
    const file = form.get("file");
    const title = form.get("title");
    if (!(file instanceof File) || (title !== null && typeof title !== "string")) throw new ApiError("invalid_input");
    if (file.size > 5 * 1024 * 1024) throw new ApiError("too_large", 413);
    input = { filename: file.name, bytes: new Uint8Array(await file.arrayBuffer()), ...(typeof title === "string" ? { title } : {}) };
  } else {
    const body = await readJson(request);
    input = { title: body.title as string, text: body.text as string };
  }
  return updateReview(id, async record => {
    draft(record);
    if (record.sources.length >= 5) throw new ApiError("too_large", 413);
    const source = await parseSource(id, input);
    const currentChars = record.sources.flatMap(item => item.passages).reduce((sum, passage) => sum + passage.text.length, 0);
    const addedChars = source.passages.reduce((sum, passage) => sum + passage.text.length, 0);
    if (currentChars + addedChars > 80000) throw new ApiError("too_large", 413);
    return { ...record, sources: [...record.sources, source] };
  });
}

/** Transport-neutral HTTP service; mutations are serialized by storage.updateReview. */
export async function handleReviewRequest(request: Request, id?: string, action?: string, model: WorkflowModel = completeJson): Promise<Response> {
  try {
    const method = request.method.toUpperCase();
    checkOrigin(request);
    if (!id && !action && method === "GET") return json({ reviews: await listReviews() });
    if (!id && !action && method === "POST") {
      const body = await readJson(request);
      return json({ review: await createReview(locale(body.locale)) }, 201);
    }
    if (!id) throw new ApiError("unsupported_action", 404);
    if (!action && method === "GET") return json({ review: await getReview(id) });
    if (!action && method === "DELETE") { await deleteReview(id); return json({ ok: true }); }
    if (!action && method === "PATCH") {
      const body = await readJson(request);
      if (body.consent !== undefined && body.consent !== true) throw new ApiError("invalid_input");
      const nextLocale = body.locale === undefined ? undefined : locale(body.locale);
      const nextProposal = body.proposal === undefined ? undefined : proposal(body.proposal);
      if (nextLocale === undefined && nextProposal === undefined && body.consent !== true) throw new ApiError("invalid_input");
      const record = await updateReview(id, previous => {
        if (nextProposal || nextLocale) draft(previous);
        return { ...previous, ...(nextLocale ? { locale: nextLocale } : {}), ...(nextProposal ? { proposal: nextProposal } : {}), ...(body.consent === true && !previous.consentAt ? { consentAt: new Date().toISOString() } : {}) };
      });
      return json({ review: record });
    }
    if (method !== "POST") throw new ApiError("unsupported_action", 404);
    if (action === "sources") return json({ review: await addSource(request, id) });
    const body = await readJson(request);
    if (action === "chat") {
      const message = boundedText(body.message, 6000);
      const record = await updateReview(id, previous => {
        if (previous.messages.length >= 40) throw new ApiError("too_large", 413);
        return chatTurn(previous, message, model);
      });
      return json({ review: record });
    }
    if (action === "generate") {
      const record = await updateReview(id, previous => {
        if (previous.stage === "draft") proposal(previous.proposal);
        return advanceReview(previous, model);
      });
      return json({ review: record });
    }
    if (action === "decision") {
      if (body.outcome !== "approve" && body.outcome !== "reject" && body.outcome !== "defer") throw new ApiError("invalid_input");
      const rationale = boundedText(body.rationale, 4000);
      const conditions = body.conditions === undefined ? "" : typeof body.conditions === "string" && body.conditions.length <= 2000 ? body.conditions.trim() : undefined;
      if (conditions === undefined) throw new ApiError("invalid_input");
      const record = await updateReview(id, previous => {
        if (previous.stage !== "complete" || !previous.snapshotId) throw new ApiError("invalid_stage", 409);
        return { ...previous, decision: { outcome: body.outcome as "approve" | "reject" | "defer", rationale, conditions, updatedAt: new Date().toISOString(), evidenceSnapshotId: previous.snapshotId! } };
      });
      return json({ review: record });
    }
    throw new ApiError("unsupported_action", 404);
  } catch (error) {
    return failure(error);
  }
}
