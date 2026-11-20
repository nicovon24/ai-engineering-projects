import { deleteConversation, getConversation } from "@/lib/history";
import { conversationView } from "@/lib/workspace-view";

export const runtime = "nodejs";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Context) {
  const { id } = await context.params;
  const conversation = getConversation(id);
  if (!conversation) return Response.json({ error: "Conversation not found." }, { status: 404 });
  return Response.json({ conversation: conversationView(conversation) }, { headers: { "cache-control": "no-store" } });
}

export async function DELETE(_request: Request, context: Context) {
  const { id } = await context.params;
  if (!deleteConversation(id)) return Response.json({ error: "Conversation not found." }, { status: 404 });
  return Response.json({ deleted: true });
}
