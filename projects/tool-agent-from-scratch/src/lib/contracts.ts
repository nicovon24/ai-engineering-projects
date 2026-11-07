export type Locale = "es" | "en";

export type RunStatus = "completed" | "rejected" | "tool_error" | "step_limit";

export type ToolName = "search_notes" | "read_note";

export type TracePhase = "started" | "planning" | "validating" | "executing" | "completed" | "stopped";

export interface TraceEntry {
  decision: number;
  phase: TracePhase;
  tool?: ToolName;
  outcome: string;
}

export interface PublicNote {
  id: string;
  title: string;
  content: string;
}

export interface AgentRun {
  status: RunStatus;
  answer?: string;
  noteIds: string[];
  trace: TraceEntry[];
  error?: { code: string; message: string };
}
