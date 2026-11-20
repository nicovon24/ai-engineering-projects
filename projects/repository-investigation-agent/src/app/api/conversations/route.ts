import { listConversations } from "@/lib/history";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const repoKey = new URL(request.url).searchParams.get("repoKey") || undefined;
    return Response.json({ items: listConversations(repoKey) }, { headers: { "cache-control": "no-store" } });
  } catch {
    return Response.json({ error: "Invalid repository key." }, { status: 400 });
  }
}
