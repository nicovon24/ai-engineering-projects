import type { AgentRun, Locale, ToolName, TraceEntry } from "@/lib/contracts";
import { deterministicPlanner, type PlannerInput, type PlannerDecision } from "./planner";
import { executeTool, ToolValidationError, validateToolCall, type ToolResult } from "./tools";

const MAX_DECISIONS = 4;
type Planner = (input: PlannerInput) => PlannerDecision;

function errorRun(status: AgentRun["status"], code: string, message: string, trace: TraceEntry[]): AgentRun {
  return { status, noteIds: [], trace, error: { code, message } };
}

function hasInlineCitation(answer: string): boolean {
  return /\[[^\]]+\]|\b(?:faro-delivery|faro-scope)\b|\b(?:source|fuente|cite|cita)\s*:/i.test(answer);
}

export function runAgent(request: string, locale: Locale, planner: Planner = deterministicPlanner): AgentRun {
  const trace: TraceEntry[] = [{ decision: 0, phase: "started", outcome: "started" }];
  const outcomes: ToolResult[] = [];
  const readIds = new Set<string>();

  for (let decision = 1; decision <= MAX_DECISIONS; decision += 1) {
    trace.push({ decision, phase: "planning", outcome: "decision_requested" });
    let next: PlannerDecision;
    try {
      next = planner({ request, locale, outcomes: [...outcomes] });
    } catch {
      trace.push({ decision, phase: "stopped", outcome: "planner_error" });
      return errorRun("rejected", "PLANNER_ERROR", "The planner could not make a decision.", trace);
    }

    if (next.kind === "final") {
      if (
        typeof next.answer !== "string" || !next.answer.trim() ||
        !Array.isArray(next.noteIds) ||
        next.noteIds.some((id) => typeof id !== "string" || !readIds.has(id)) ||
        hasInlineCitation(next.answer)
      ) {
        trace.push({ decision, phase: "stopped", outcome: "invalid_answer" });
        return errorRun("rejected", "INVALID_ANSWER", "The answer or its source IDs failed validation.", trace);
      }
      trace.push({ decision, phase: "validating", outcome: "answer_checked" });
      trace.push({ decision, phase: "completed", outcome: "answer_returned" });
      return { status: "completed", answer: next.answer.trim(), noteIds: [...new Set(next.noteIds)], trace };
    }

    if (next.kind !== "tool" || typeof next.name !== "string") {
      trace.push({ decision, phase: "stopped", outcome: "invalid_decision" });
      return errorRun("rejected", "INVALID_DECISION", "The planner returned an invalid decision.", trace);
    }
    const tool = next.name === "search_notes" || next.name === "read_note" ? next.name as ToolName : undefined;
    let call;
    try {
      call = validateToolCall(next.name, next.args);
    } catch (error) {
      const code = error instanceof ToolValidationError ? error.code : "INVALID_DECISION";
      trace.push({ decision, phase: "stopped", ...(tool && { tool }), outcome: code.toLowerCase() });
      return errorRun("rejected", code, "The tool call was rejected before execution.", trace);
    }
    trace.push({ decision, phase: "validating", tool: call.name, outcome: "call_checked" });
    trace.push({ decision, phase: "executing", tool: call.name, outcome: "call_started" });
    try {
      const result = executeTool(call);
      outcomes.push(result);
      if (result.name === "read_note") readIds.add(result.note.id);
      trace.push({ decision, phase: "executing", tool: call.name, outcome: result.name === "search_notes" ? `returned_${result.hits.length}_hits` : "note_read" });
    } catch {
      trace.push({ decision, phase: "stopped", tool: call.name, outcome: "tool_error" });
      return errorRun("tool_error", "TOOL_ERROR", "The tool could not complete its call.", trace);
    }
  }

  trace.push({ decision: MAX_DECISIONS, phase: "stopped", outcome: "decision_limit_reached" });
  return errorRun("step_limit", "STEP_LIMIT", "The run reached the four-decision limit.", trace);
}
