import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { randomUUID } from "node:crypto";
import { DatabaseSync } from "node:sqlite";

export type RepositoryRef = { owner: string; repo: string; sha: string };
export type TraceEntry = {
  tool: string;
  outcome: string;
  path?: string;
  detail?: string;
};
export type InspectedPath = { path: string; outcome: string; detail?: string };
export type EvidenceExcerpt = {
  id: string;
  path: string;
  startLine: number;
  endLine: number;
  excerpt: string;
  sha?: string;
  sourceConversationId?: string;
  sourceRunId?: string;
};
export type Citation = {
  evidenceId: string;
  path: string;
  startLine: number;
  endLine: number;
  url?: string;
};
export type RunResult = {
  answer: string;
  status: string;
  mode?: "fixture" | "provider";
  changed?: boolean;
  error?: string;
  trace?: TraceEntry[];
  inspectedPaths?: InspectedPath[];
  evidence?: EvidenceExcerpt[];
  citations?: Citation[];
};
export type SaveRunInput = {
  conversationId: string;
  repository: RepositoryRef;
  question: string;
  result: RunResult;
};
export type HistoryMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  runId: string;
  sha: string;
  createdAt: string;
};
export type HistoryRun = {
  id: string;
  sha: string;
  status: string;
  mode?: "fixture" | "provider";
  changed?: boolean;
  error?: string;
  trace: TraceEntry[];
  inspectedPaths: InspectedPath[];
  evidence: EvidenceExcerpt[];
  citations: Citation[];
  createdAt: string;
};
export type Conversation = {
  id: string;
  repoKey: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: HistoryMessage[];
  runs: HistoryRun[];
};
export type ConversationSummary = Omit<Conversation, "messages" | "runs"> & {
  messageCount: number;
  latestSha: string | null;
};
export type HistorySearchHit = {
  conversationId: string;
  conversationTitle: string;
  messageId: string;
  role: "user" | "assistant";
  text: string;
  runId: string;
  sha: string;
  createdAt: string;
};
export type PriorFinding = {
  conversationId: string;
  conversationTitle: string;
  runId: string;
  sha: string;
  question: string;
  answer: string;
  status: string;
  evidence: EvidenceExcerpt[];
  inspectedPaths: InspectedPath[];
  citations: Citation[];
  createdAt: string;
};

type Row = Record<string, unknown>;

function repoParts(repoKey: string): [string, string] {
  const match = /^([A-Za-z0-9][A-Za-z0-9-]{0,38})\/([A-Za-z0-9._-]+)$/.exec(repoKey.trim());
  if (!match || match[2].endsWith(".git") || match[2] === "." || match[2] === "..") {
    throw new Error("Expected a canonical owner/repo key");
  }
  return [match[1].toLowerCase(), match[2].toLowerCase()];
}

export function canonicalRepoKey(repoKey: string): string {
  return repoParts(repoKey).join("/");
}

function asJson<T>(value: unknown): T {
  return JSON.parse(String(value)) as T;
}

function requireText(value: string, name: string): string {
  if (!value.trim()) throw new Error(`${name} is required`);
  return value;
}

export function createHistoryStore(options: { dbPath?: string } = {}) {
  const dbPath = options.dbPath ?? join(process.cwd(), ".local-data", "agent.sqlite");
  if (dbPath !== ":memory:") mkdirSync(dirname(dbPath), { recursive: true });
  const db = new DatabaseSync(dbPath);
  db.exec("PRAGMA foreign_keys = ON");
  db.exec("PRAGMA journal_mode = WAL");
  const version = Number(db.prepare("PRAGMA user_version").get()?.user_version ?? 0);
  if (version > 2) throw new Error(`Unsupported history schema version ${version}`);
  if (version === 0) {
    db.exec(`
      BEGIN;
      CREATE TABLE repositories (
        repo_key TEXT PRIMARY KEY,
        owner TEXT NOT NULL,
        repo TEXT NOT NULL
      );
      CREATE TABLE conversations (
        id TEXT PRIMARY KEY,
        repo_key TEXT NOT NULL REFERENCES repositories(repo_key),
        title TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      CREATE TABLE runs (
        id TEXT PRIMARY KEY,
        conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
        sha TEXT NOT NULL,
        status TEXT NOT NULL,
        trace_json TEXT NOT NULL,
        created_at TEXT NOT NULL,
        mode TEXT CHECK(mode IN ('fixture', 'provider')),
        changed INTEGER CHECK(changed IN (0, 1)),
        error TEXT
      );
      CREATE TABLE messages (
        id TEXT PRIMARY KEY,
        conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
        run_id TEXT NOT NULL REFERENCES runs(id) ON DELETE CASCADE,
        sequence INTEGER NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('user', 'assistant')),
        text TEXT NOT NULL,
        created_at TEXT NOT NULL,
        UNIQUE(conversation_id, sequence)
      );
      CREATE TABLE inspected_paths (
        id TEXT PRIMARY KEY,
        run_id TEXT NOT NULL REFERENCES runs(id) ON DELETE CASCADE,
        ordinal INTEGER NOT NULL,
        path TEXT NOT NULL,
        outcome TEXT NOT NULL,
        detail TEXT,
        UNIQUE(run_id, ordinal)
      );
      CREATE TABLE evidence (
        id TEXT PRIMARY KEY,
        run_id TEXT NOT NULL REFERENCES runs(id) ON DELETE CASCADE,
        source_evidence_id TEXT NOT NULL,
        path TEXT NOT NULL,
        sha TEXT NOT NULL,
        start_line INTEGER NOT NULL,
        end_line INTEGER NOT NULL,
        excerpt TEXT NOT NULL,
        source_conversation_id TEXT,
        source_run_id TEXT,
        UNIQUE(run_id, source_evidence_id)
      );
      CREATE TABLE citations (
        id TEXT PRIMARY KEY,
        run_id TEXT NOT NULL REFERENCES runs(id) ON DELETE CASCADE,
        evidence_id TEXT NOT NULL REFERENCES evidence(id) ON DELETE CASCADE,
        ordinal INTEGER NOT NULL,
        path TEXT NOT NULL,
        start_line INTEGER NOT NULL,
        end_line INTEGER NOT NULL,
        url TEXT,
        UNIQUE(run_id, ordinal)
      );
      CREATE INDEX conversations_repo ON conversations(repo_key, updated_at);
      CREATE INDEX messages_conversation ON messages(conversation_id, sequence);
      CREATE INDEX runs_conversation ON runs(conversation_id, created_at);
      PRAGMA user_version = 2;
      COMMIT;
    `);
  } else if (version === 1) {
    db.exec(`
      BEGIN;
      ALTER TABLE runs ADD COLUMN mode TEXT CHECK(mode IN ('fixture', 'provider'));
      ALTER TABLE runs ADD COLUMN changed INTEGER CHECK(changed IN (0, 1));
      ALTER TABLE runs ADD COLUMN error TEXT;
      PRAGMA user_version = 2;
      COMMIT;
    `);
  }

  function transaction<T>(fn: () => T): T {
    db.exec("BEGIN");
    try {
      const value = fn();
      db.exec("COMMIT");
      return value;
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }
  }

  function createConversation(repoKey: string, title = "New conversation"): ConversationSummary {
    const key = canonicalRepoKey(repoKey);
    const [owner, repo] = repoParts(key);
    const id = randomUUID();
    const now = new Date().toISOString();
    transaction(() => {
      db.prepare("INSERT OR IGNORE INTO repositories VALUES (?, ?, ?)").run(key, owner, repo);
      db.prepare("INSERT INTO conversations VALUES (?, ?, ?, ?, ?)").run(id, key, title, now, now);
    });
    return { id, repoKey: key, title, createdAt: now, updatedAt: now, messageCount: 0, latestSha: null };
  }

  function listConversations(repoKey?: string): ConversationSummary[] {
    const rows = (repoKey
      ? db.prepare(`SELECT c.*, COUNT(m.id) AS message_count,
          (SELECT r.sha FROM runs r WHERE r.conversation_id = c.id ORDER BY r.created_at DESC, r.rowid DESC LIMIT 1) AS latest_sha
          FROM conversations c LEFT JOIN messages m ON m.conversation_id = c.id
          WHERE c.repo_key = ? GROUP BY c.id ORDER BY c.updated_at DESC, c.rowid DESC`).all(canonicalRepoKey(repoKey))
      : db.prepare(`SELECT c.*, COUNT(m.id) AS message_count,
          (SELECT r.sha FROM runs r WHERE r.conversation_id = c.id ORDER BY r.created_at DESC, r.rowid DESC LIMIT 1) AS latest_sha
          FROM conversations c LEFT JOIN messages m ON m.conversation_id = c.id
          GROUP BY c.id ORDER BY c.updated_at DESC, c.rowid DESC`).all()) as Row[];
    return rows.map((r) => ({
      id: String(r.id), repoKey: String(r.repo_key), title: String(r.title),
      createdAt: String(r.created_at), updatedAt: String(r.updated_at),
      messageCount: Number(r.message_count), latestSha: r.latest_sha === null ? null : String(r.latest_sha),
    }));
  }

  function getConversation(id: string): Conversation | null {
    const row = db.prepare("SELECT * FROM conversations WHERE id = ?").get(id) as Row | undefined;
    if (!row) return null;
    const messages = db.prepare(`SELECT m.*, r.sha FROM messages m JOIN runs r ON r.id = m.run_id
      WHERE m.conversation_id = ? ORDER BY m.sequence`).all(id) as Row[];
    const runs = db.prepare("SELECT * FROM runs WHERE conversation_id = ? ORDER BY created_at, rowid").all(id) as Row[];
    return {
      id, repoKey: String(row.repo_key), title: String(row.title),
      createdAt: String(row.created_at), updatedAt: String(row.updated_at),
      messages: messages.map((m) => ({
        id: String(m.id), role: m.role as "user" | "assistant", text: String(m.text),
        runId: String(m.run_id), sha: String(m.sha), createdAt: String(m.created_at),
      })),
      runs: runs.map((r) => hydrateRun(r)),
    };
  }

  function hydrateEvidence(runId: string): EvidenceExcerpt[] {
    return (db.prepare("SELECT * FROM evidence WHERE run_id = ? ORDER BY rowid").all(runId) as Row[]).map((e) => ({
      id: String(e.source_evidence_id), path: String(e.path), sha: String(e.sha),
      startLine: Number(e.start_line), endLine: Number(e.end_line), excerpt: String(e.excerpt),
      ...(e.source_conversation_id ? { sourceConversationId: String(e.source_conversation_id) } : {}),
      ...(e.source_run_id ? { sourceRunId: String(e.source_run_id) } : {}),
    }));
  }

  function hydrateInspectedPaths(runId: string): InspectedPath[] {
    return (db.prepare("SELECT * FROM inspected_paths WHERE run_id = ? ORDER BY ordinal").all(runId) as Row[]).map((p) => ({
      path: String(p.path), outcome: String(p.outcome), ...(p.detail ? { detail: String(p.detail) } : {}),
    }));
  }

  function hydrateCitations(runId: string): Citation[] {
    return (db.prepare(`SELECT c.*, e.source_evidence_id FROM citations c JOIN evidence e ON e.id = c.evidence_id
      WHERE c.run_id = ? ORDER BY c.ordinal`).all(runId) as Row[]).map((c) => ({
      evidenceId: String(c.source_evidence_id), path: String(c.path),
      startLine: Number(c.start_line), endLine: Number(c.end_line),
      ...(c.url ? { url: String(c.url) } : {}),
    }));
  }

  function hydrateRun(r: Row): HistoryRun {
    const id = String(r.id);
    return {
      id, sha: String(r.sha), status: String(r.status), trace: asJson<TraceEntry[]>(r.trace_json),
      ...(r.mode ? { mode: r.mode as "fixture" | "provider" } : {}),
      ...(r.changed !== null ? { changed: Boolean(r.changed) } : {}),
      ...(r.error ? { error: String(r.error) } : {}),
      inspectedPaths: hydrateInspectedPaths(id), evidence: hydrateEvidence(id),
      citations: hydrateCitations(id), createdAt: String(r.created_at),
    };
  }

  function saveRun({ conversationId, repository, question, result }: SaveRunInput): HistoryRun {
    const repoKey = canonicalRepoKey(`${repository.owner}/${repository.repo}`);
    const conversation = db.prepare("SELECT repo_key FROM conversations WHERE id = ?").get(conversationId) as Row | undefined;
    if (!conversation) throw new Error("Conversation not found");
    if (conversation.repo_key !== repoKey) throw new Error("Run repository differs from conversation repository");
    const sha = requireText(repository.sha, "Repository SHA");
    requireText(question, "Question");
    requireText(result.answer, "Answer");
    const runId = randomUUID();
    const now = new Date().toISOString();
    transaction(() => {
      db.prepare(`INSERT INTO runs
        (id, conversation_id, sha, status, trace_json, created_at, mode, changed, error)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
        runId, conversationId, sha, result.status, JSON.stringify(result.trace ?? []), now,
        result.mode ?? null, result.changed === undefined ? null : Number(result.changed), result.error ?? null,
      );
      const nextSequence = Number((db.prepare("SELECT COALESCE(MAX(sequence), 0) + 1 AS seq FROM messages WHERE conversation_id = ?")
        .get(conversationId) as Row).seq);
      const insertMessage = db.prepare("INSERT INTO messages VALUES (?, ?, ?, ?, ?, ?, ?)");
      insertMessage.run(randomUUID(), conversationId, runId, nextSequence, "user", question, now);
      insertMessage.run(randomUUID(), conversationId, runId, nextSequence + 1, "assistant", result.answer, now);
      const insertPath = db.prepare("INSERT INTO inspected_paths VALUES (?, ?, ?, ?, ?, ?)");
      (result.inspectedPaths ?? []).forEach((p, i) => insertPath.run(randomUUID(), runId, i, p.path, p.outcome, p.detail ?? null));
      const insertEvidence = db.prepare("INSERT INTO evidence VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
      const evidenceIds = new Map<string, string>();
      for (const e of result.evidence ?? []) {
        if (e.sha && e.sha !== sha) throw new Error("Evidence SHA differs from run SHA");
        if (e.startLine < 1 || e.endLine < e.startLine || e.excerpt.length > 4096) throw new Error("Invalid or oversized evidence excerpt");
        const id = randomUUID();
        insertEvidence.run(id, runId, e.id, e.path, sha, e.startLine, e.endLine, e.excerpt,
          e.sourceConversationId ?? null, e.sourceRunId ?? null);
        evidenceIds.set(e.id, id);
      }
      const insertCitation = db.prepare("INSERT INTO citations VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
      (result.citations ?? []).forEach((c, i) => {
        const evidenceId = evidenceIds.get(c.evidenceId);
        if (!evidenceId) throw new Error(`Citation evidence ${c.evidenceId} was not copied into this run`);
        const evidence = (result.evidence ?? []).find((e) => e.id === c.evidenceId)!;
        if (c.path !== evidence.path || c.startLine < evidence.startLine || c.endLine > evidence.endLine || c.endLine < c.startLine) {
          throw new Error("Citation exceeds retained evidence coordinates");
        }
        insertCitation.run(randomUUID(), runId, evidenceId, i, c.path, c.startLine, c.endLine, c.url ?? null);
      });
      db.prepare("UPDATE conversations SET updated_at = ? WHERE id = ?").run(now, conversationId);
    });
    return hydrateRun(db.prepare("SELECT * FROM runs WHERE id = ?").get(runId) as Row);
  }

  function searchHistory(repoKey: string, query: string): HistorySearchHit[] {
    const key = canonicalRepoKey(repoKey);
    if (!query.trim()) return [];
    const escaped = query.replace(/[\\%_]/g, "\\$&");
    const rows = db.prepare(`SELECT c.id AS conversation_id, c.title AS conversation_title,
      m.id AS message_id, m.role, m.text, m.run_id, m.created_at, r.sha
      FROM messages m JOIN conversations c ON c.id = m.conversation_id JOIN runs r ON r.id = m.run_id
      WHERE c.repo_key = ? AND m.text LIKE ? ESCAPE '\\'
      ORDER BY m.created_at DESC, m.sequence DESC`).all(key, `%${escaped}%`) as Row[];
    return rows.map((r) => ({
      conversationId: String(r.conversation_id), conversationTitle: String(r.conversation_title),
      messageId: String(r.message_id), role: r.role as "user" | "assistant", text: String(r.text),
      runId: String(r.run_id), sha: String(r.sha), createdAt: String(r.created_at),
    }));
  }

  function getPriorFindings(repoKey: string, question: string, limit = 5): PriorFinding[] {
    const key = canonicalRepoKey(repoKey);
    const terms = [...new Set((question.toLowerCase().match(/[\p{L}\p{N}_-]{3,}/gu) ?? []))];
    const rows = db.prepare(`SELECT r.*, c.title AS conversation_title,
      (SELECT text FROM messages WHERE run_id = r.id AND role = 'user' LIMIT 1) AS question,
      (SELECT text FROM messages WHERE run_id = r.id AND role = 'assistant' LIMIT 1) AS answer
      FROM runs r JOIN conversations c ON c.id = r.conversation_id
      WHERE c.repo_key = ? AND (
        EXISTS (SELECT 1 FROM evidence excerpt WHERE excerpt.run_id = r.id AND excerpt.sha = r.sha)
        OR EXISTS (SELECT 1 FROM inspected_paths path WHERE path.run_id = r.id)
      ) ORDER BY r.created_at DESC, r.rowid DESC LIMIT 200`).all(key) as Row[];
    const scored = rows.map((r) => {
      const evidence = hydrateEvidence(String(r.id));
      const inspectedPaths = hydrateInspectedPaths(String(r.id));
      const citations = hydrateCitations(String(r.id));
      const content = `${r.question} ${r.answer} ${evidence.map((e) => e.path).join(" ")} ${inspectedPaths.map((p) => p.path).join(" ")}`.toLowerCase();
      return { r, evidence, inspectedPaths, citations, score: terms.reduce((n, term) => n + (content.includes(term) ? 1 : 0), 0) };
    }).filter((item) => item.score > 0 || terms.length === 0);
    scored.sort((a, b) => b.score - a.score || String(b.r.created_at).localeCompare(String(a.r.created_at)));
    return scored.slice(0, Math.max(0, Math.min(limit, 20))).map(({ r, evidence, inspectedPaths, citations }) => ({
      conversationId: String(r.conversation_id), conversationTitle: String(r.conversation_title),
      runId: String(r.id), sha: String(r.sha), question: String(r.question), answer: String(r.answer),
      status: String(r.status), evidence, inspectedPaths, citations,
      createdAt: String(r.created_at),
    }));
  }

  function deleteConversation(id: string): boolean {
    return db.prepare("DELETE FROM conversations WHERE id = ?").run(id).changes > 0;
  }

  return { createConversation, listConversations, getConversation, saveRun, searchHistory, getPriorFindings, deleteConversation, close: () => db.close() };
}

let defaultStore: ReturnType<typeof createHistoryStore> | undefined;
function store() { return (defaultStore ??= createHistoryStore()); }
export const createConversation = (repoKey: string, title?: string) => store().createConversation(repoKey, title);
export const listConversations = (repoKey?: string) => store().listConversations(repoKey);
export const getConversation = (id: string) => store().getConversation(id);
export const saveRun = (input: SaveRunInput) => store().saveRun(input);
export const searchHistory = (repoKey: string, query: string) => store().searchHistory(repoKey, query);
export const getPriorFindings = (repoKey: string, question: string, limit?: number) => store().getPriorFindings(repoKey, question, limit);
export const deleteConversation = (id: string) => store().deleteConversation(id);
