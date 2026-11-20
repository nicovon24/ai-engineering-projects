import { createConversation, getConversation, getPriorFindings, listConversations, saveRun } from "@/lib/history";
import { investigate, parseRepositoryUrl, InvestigationError, type Evidence, type PriorFinding } from "@/lib/repository";
import { conversationView } from "@/lib/workspace-view";

export const runtime = "nodejs";

type AskBody = { repositoryUrl?: unknown; question?: unknown; locale?: unknown; conversationId?: unknown };

function priorEvidence(repoKey: string, sha: string, items: Array<{ id: string; path: string; startLine: number; endLine: number; excerpt: string; sourceConversationId?: string }>): Evidence[] {
  return items.map((item) => ({
    id: item.id, path: item.path, startLine: item.startLine, endLine: item.endLine,
    excerpt: item.excerpt, sha,
    url: `https://github.com/${repoKey}/blob/${sha}/${item.path.split("/").map(encodeURIComponent).join("/")}#L${item.startLine}${item.endLine === item.startLine ? "" : `-L${item.endLine}`}`,
    ...(item.sourceConversationId ? { originConversationId: item.sourceConversationId } : {}),
  }));
}

export async function POST(request: Request) {
  let body: AskBody;
  try {
    const text = await request.text();
    if (text.length > 8_000) return Response.json({ error: "Request is too large." }, { status: 413 });
    body = JSON.parse(text) as AskBody;
  } catch { return Response.json({ error: "Invalid JSON request." }, { status: 400 }); }
  if (!body || typeof body.repositoryUrl !== "string" || typeof body.question !== "string" ||
      !body.question.trim() || body.question.length > 2_000 || (body.locale !== "es" && body.locale !== "en") ||
      (body.conversationId !== undefined && typeof body.conversationId !== "string")) {
    return Response.json({ error: "Invalid repository, question, locale, or conversation." }, { status: 400 });
  }
  let parsed: ReturnType<typeof parseRepositoryUrl>;
  try { parsed = parseRepositoryUrl(body.repositoryUrl); }
  catch (error) { return Response.json({ error: error instanceof InvestigationError ? error.message : "Invalid repository URL." }, { status: 400 }); }

  let conversation = typeof body.conversationId === "string" ? getConversation(body.conversationId) : null;
  if (body.conversationId && !conversation) return Response.json({ error: "Conversation not found." }, { status: 404 });
  if (conversation && conversation.repoKey !== parsed.key) return Response.json({ error: "Conversation belongs to another repository." }, { status: 409 });

  const prior: PriorFinding[] = getPriorFindings(parsed.key, body.question, 5).map((finding) => ({
    conversationId: finding.conversationId, runId: finding.runId, sha: finding.sha,
    question: finding.question, answer: finding.answer,
    evidence: priorEvidence(parsed.key, finding.sha, finding.evidence),
    inspectedPaths: finding.inspectedPaths,
  }));
  const previousSha = conversation?.runs.at(-1)?.sha ?? listConversations(parsed.key).find((item) => item.latestSha)?.latestSha;
  const result = await investigate({ repositoryUrl: body.repositoryUrl, question: body.question, locale: body.locale, prior });
  const historical = prior.map((finding) => ({ conversationId: finding.conversationId, question: finding.question, answer: finding.answer, sha: finding.sha }));
  if (!result.repository.sha) {
    return Response.json({
      error: result.answer,
      result,
      historical,
    }, { status: 422 });
  }
  if (previousSha && previousSha !== result.repository.sha) result.changed = true;
  try {
    if (!conversation) {
      const title = body.question.trim().slice(0, 72);
      const summary = createConversation(parsed.key, title);
      conversation = getConversation(summary.id);
    }
    if (!conversation) throw new Error("Could not create conversation.");
    saveRun({
      conversationId: conversation.id,
      repository: { owner: result.repository.owner, repo: result.repository.repo, sha: result.repository.sha },
      question: body.question,
      result: {
        answer: result.answer, status: result.status, mode: result.mode, changed: result.changed, error: result.error,
        trace: result.trace.map((entry) => ({ tool: entry.tool, outcome: entry.status, detail: entry.detail, ...(entry.path ? { path: entry.path } : {}) })),
        inspectedPaths: result.trace.filter((entry) => entry.path).map((entry) => ({ path: entry.path!, outcome: entry.status, detail: entry.detail })),
        evidence: result.evidence.map((item) => ({
          id: item.id, path: item.path, startLine: item.startLine, endLine: item.endLine,
          excerpt: item.excerpt.slice(0, 4_096), sha: item.sha,
          ...(item.originConversationId ? { sourceConversationId: item.originConversationId } : {}),
        })),
        citations: result.citations.map((item) => ({ evidenceId: item.id, path: item.path, startLine: item.startLine, endLine: item.endLine, url: item.url })),
      },
    });
    const saved = getConversation(conversation.id);
    if (!saved) throw new Error("Saved conversation not found.");
    return Response.json({ conversation: conversationView(saved), historical: result.status === "stopped" && result.changed ? historical : [] }, { headers: { "cache-control": "no-store" } });
  } catch {
    return Response.json({ error: "Could not save the investigation locally." }, { status: 500 });
  }
}
