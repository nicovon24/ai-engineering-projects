import { searchHistory } from "@/lib/history";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const repoKey = params.get("repoKey") ?? "";
  const query = params.get("q") ?? "";
  if (!repoKey || query.length > 200) return Response.json({ error: "Invalid search." }, { status: 400 });
  try {
    const items = searchHistory(repoKey, query).slice(0, 50).map((hit) => ({
      conversationId: hit.conversationId, messageId: hit.messageId, role: hit.role,
      text: hit.text, sha: hit.sha, title: hit.conversationTitle,
    }));
    return Response.json({ items }, { headers: { "cache-control": "no-store" } });
  } catch {
    return Response.json({ error: "Invalid repository key." }, { status: 400 });
  }
}
