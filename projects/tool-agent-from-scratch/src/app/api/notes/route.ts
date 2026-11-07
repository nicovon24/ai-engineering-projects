import { listNotes } from "@/agent/notes";

export function GET(): Response {
  return Response.json(listNotes());
}
