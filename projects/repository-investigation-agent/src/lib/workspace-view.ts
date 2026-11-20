import type { Conversation, HistoryRun } from "./history";
import type { Evidence, InvestigationResult, TraceEntry } from "./repository";

function sourceUrl(repoKey: string, sha: string, path: string, startLine: number, endLine: number): string {
  const encoded = path.split("/").map(encodeURIComponent).join("/");
  return `https://github.com/${repoKey}/blob/${sha}/${encoded}#L${startLine}${endLine === startLine ? "" : `-L${endLine}`}`;
}

function resultFromRun(repoKey: string, run: HistoryRun, answer: string): InvestigationResult {
  const [owner, repo] = repoKey.split("/");
  const evidence: Evidence[] = run.evidence.map((item) => ({
    id: item.id, path: item.path, startLine: item.startLine, endLine: item.endLine,
    excerpt: item.excerpt, sha: item.sha ?? run.sha,
    url: sourceUrl(repoKey, run.sha, item.path, item.startLine, item.endLine),
    ...(item.sourceConversationId ? { originConversationId: item.sourceConversationId } : {}),
  }));
  const citations = run.citations.flatMap((cite) => {
    const item = evidence.find((source) => source.id === cite.evidenceId);
    return item ? [{ ...item, url: cite.url ?? item.url }] : [];
  });
  const trace: TraceEntry[] = run.trace.map((entry, index) => ({
    step: index + 1, tool: entry.tool,
    status: entry.outcome === "ok" || entry.outcome === "rejected" || entry.outcome === "error" ? entry.outcome : "stop",
    detail: entry.detail ?? entry.outcome, sha: run.sha,
    ...(entry.path ? { path: entry.path } : {}),
  }));
  return {
    status: run.status === "answered" || run.status === "insufficient_evidence" ? run.status : "stopped",
    answer, repository: { owner, repo, key: repoKey, sha: run.sha, url: `https://github.com/${repoKey}` },
    evidence, citations, trace,
    mode: run.mode === "fixture" ? "fixture" : "provider",
    changed: Boolean(run.changed),
    ...(run.error ? { error: run.error } : {}),
  };
}

export function conversationView(conversation: Conversation) {
  const runs = new Map(conversation.runs.map((run) => [run.id, run]));
  return {
    id: conversation.id, repoKey: conversation.repoKey, title: conversation.title,
    messages: conversation.messages.map((message) => {
      const run = runs.get(message.runId);
      return {
        id: message.id, role: message.role, text: message.text, sha: message.sha,
        createdAt: message.createdAt,
        ...(message.role === "assistant" && run ? { result: resultFromRun(conversation.repoKey, run, message.text) } : {}),
      };
    }),
  };
}
