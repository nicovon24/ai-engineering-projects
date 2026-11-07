import type { AgentRun, Locale } from "@/lib/contracts";
import { runAgent } from "@/agent/run";

const MAX_BODY_BYTES = 16_384;
const MAX_REQUEST_LENGTH = 1_000;

function invalidRequest(): AgentRun {
  return {
    status: "rejected",
    noteIds: [],
    trace: [{ decision: 0, phase: "stopped", outcome: "invalid_request" }],
    error: { code: "INVALID_REQUEST", message: "A request and a supported locale are required." },
  };
}

export async function POST(request: Request): Promise<Response> {
  let payload: unknown;
  try {
    const raw = await request.text();
    if (new TextEncoder().encode(raw).byteLength > MAX_BODY_BYTES) return Response.json(invalidRequest(), { status: 413 });
    payload = JSON.parse(raw);
  } catch {
    return Response.json(invalidRequest(), { status: 400 });
  }

  if (
    typeof payload !== "object" || payload === null || Array.isArray(payload) ||
    Object.keys(payload).length !== 2 || !Object.hasOwn(payload, "request") || !Object.hasOwn(payload, "locale")
  ) return Response.json(invalidRequest(), { status: 400 });

  const input = payload as Record<string, unknown>;
  if (
    typeof input.request !== "string" || !input.request.trim() ||
    input.request.length > MAX_REQUEST_LENGTH ||
    (input.locale !== "es" && input.locale !== "en")
  ) return Response.json(invalidRequest(), { status: 400 });

  return Response.json(runAgent(input.request.trim(), input.locale as Locale));
}
