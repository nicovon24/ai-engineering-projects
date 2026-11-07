import type { PublicNote, ToolName } from "@/lib/contracts";
import { getNote, isAllowedNoteId, listNotes } from "./notes";

export type SearchHit = { id: string; title: string; excerpt: string };
export type ToolResult = { name: "search_notes"; hits: SearchHit[] } | { name: "read_note"; note: PublicNote };
export type ValidatedCall =
  | { name: "search_notes"; args: { query: string; limit: number } }
  | { name: "read_note"; args: { note_id: string } };

export class ToolValidationError extends Error {
  constructor(public readonly code: "UNKNOWN_TOOL" | "INVALID_ARGUMENTS" | "NOTE_NOT_ALLOWED") {
    super(code);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasExactKeys(value: Record<string, unknown>, expected: string[]): boolean {
  const keys = Object.keys(value);
  return keys.length === expected.length && expected.every((key) => Object.hasOwn(value, key));
}

export function validateToolCall(name: string, args: unknown): ValidatedCall {
  if (name !== "search_notes" && name !== "read_note") {
    throw new ToolValidationError("UNKNOWN_TOOL");
  }
  if (!isRecord(args)) {
    throw new ToolValidationError("INVALID_ARGUMENTS");
  }
  if (name === "search_notes") {
    if (
      !hasExactKeys(args, ["query", "limit"]) ||
      typeof args.query !== "string" ||
      args.query.trim().length === 0 ||
      typeof args.limit !== "number" ||
      !Number.isInteger(args.limit) ||
      args.limit < 1 ||
      args.limit > 5
    ) {
      throw new ToolValidationError("INVALID_ARGUMENTS");
    }
    return { name, args: { query: args.query.trim(), limit: args.limit } };
  }
  if (!hasExactKeys(args, ["note_id"]) || typeof args.note_id !== "string") {
    throw new ToolValidationError("INVALID_ARGUMENTS");
  }
  if (!isAllowedNoteId(args.note_id)) {
    throw new ToolValidationError("NOTE_NOT_ALLOWED");
  }
  return { name, args: { note_id: args.note_id } };
}

const registry: Readonly<Record<ToolName, (call: ValidatedCall) => ToolResult>> = {
  search_notes(call) {
    if (call.name !== "search_notes") throw new Error("Invalid registry dispatch");
    const words = call.args.query.toLocaleLowerCase("en").split(/\s+/).filter(Boolean);
    const hits = listNotes()
      .map((note) => ({
        note,
        score: words.filter((word) => `${note.title} ${note.content}`.toLocaleLowerCase("en").includes(word)).length,
      }))
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, call.args.limit)
      .map(({ note }) => ({ id: note.id, title: note.title, excerpt: note.content.slice(0, 120) }));
    return { name: "search_notes", hits };
  },
  read_note(call) {
    if (call.name !== "read_note") throw new Error("Invalid registry dispatch");
    const note = getNote(call.args.note_id);
    if (!note) throw new Error("Allowlisted note missing");
    return { name: "read_note", note };
  },
};

export function executeTool(call: ValidatedCall): ToolResult {
  return registry[call.name](call);
}
