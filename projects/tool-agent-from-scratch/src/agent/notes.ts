import type { PublicNote } from "@/lib/contracts";

const NOTES: readonly PublicNote[] = [
  {
    id: "faro-delivery",
    title: "Project Faro — delivery plan",
    content:
      "Project Faro's first version is due on 18 November 2026. The team will share the local demo and a short handoff note on that date.",
  },
  {
    id: "faro-scope",
    title: "Project Faro — first version scope",
    content:
      "The first version of Project Faro includes a question form, a searchable set of two sample notes, an answer with source IDs, and a visible execution trace. File uploads and live web search are outside this first version.",
  },
];

const noteById = new Map(NOTES.map((note) => [note.id, note]));

export function listNotes(): PublicNote[] {
  return NOTES.map((note) => ({ ...note }));
}

export function isAllowedNoteId(id: string): boolean {
  return noteById.has(id);
}

export function getNote(id: string): PublicNote | undefined {
  const note = noteById.get(id);
  return note && { ...note };
}
