import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, rmdirSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { test } from "node:test";
import { createHistoryStore } from "./index";

const repository = { owner: "Example", repo: "Project", sha: "a".repeat(40) };
const evidence = {
  id: "readme-1", path: "README.md", startLine: 2, endLine: 3,
  excerpt: "The answer is in the readme.\nIt persists.",
};
const citation = { evidenceId: evidence.id, path: evidence.path, startLine: 2, endLine: 3 };

function fixture() {
  const parent = join(process.cwd(), ".local-data");
  mkdirSync(parent, { recursive: true });
  const dir = mkdtempSync(join(parent, "ria-history-test-"));
  const dbPath = join(dir, "agent.sqlite");
  return { dbPath, cleanup: () => {
    for (const suffix of ["", "-wal", "-shm"]) {
      const file = `${dbPath}${suffix}`;
      if (existsSync(file)) {
        try { unlinkSync(file); } catch (error) {
          const code = (error as NodeJS.ErrnoException).code;
          if (code !== "EBUSY" && code !== "EPERM") throw error;
          return;
        }
      }
    }
    try { rmdirSync(dir); } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      if (code !== "EBUSY" && code !== "EPERM" && code !== "ENOTEMPTY") throw error;
    }
  } };
}

test("restart retains ordered messages, trace, evidence, and source outcomes", () => {
  const f = fixture();
  try {
    let store = createHistoryStore({ dbPath: f.dbPath });
    const conversation = store.createConversation("EXAMPLE/Project", "Architecture");
    const result = {
      answer: "See README.md.", status: "answered",
      trace: [{ tool: "read_file", path: "README.md", outcome: "ok" }],
      inspectedPaths: [{ path: "README.md", outcome: "read" }],
      evidence: [evidence], citations: [citation],
    };
    store.saveRun({ conversationId: conversation.id, repository, question: "Where is the answer?", result });
    store.saveRun({ conversationId: conversation.id, repository, question: "And again?", result });
    store.close();
    store = createHistoryStore({ dbPath: f.dbPath });
    const saved = store.getConversation(conversation.id);
    assert.ok(saved);
    assert.deepEqual(saved.messages.map((m) => [m.role, m.text]), [
      ["user", "Where is the answer?"], ["assistant", "See README.md."],
      ["user", "And again?"], ["assistant", "See README.md."],
    ]);
    assert.equal(saved.runs[0].sha, repository.sha);
    assert.deepEqual(saved.runs[0].trace, result.trace);
    assert.deepEqual(saved.runs[0].inspectedPaths, result.inspectedPaths);
    assert.equal(saved.runs[0].citations[0].evidenceId, evidence.id);
    assert.equal(saved.runs[0].evidence[0].excerpt, evidence.excerpt);
    store.close();
  } finally { f.cleanup(); }
});

test("search and prior findings stay inside the canonical repository", () => {
  const f = fixture();
  try {
    const store = createHistoryStore({ dbPath: f.dbPath });
    const first = store.createConversation("example/project");
    const other = store.createConversation("example/other");
    store.saveRun({ conversationId: first.id, repository, question: "How does caching work?", result: {
      answer: "Caching uses the readme.", status: "answered", evidence: [evidence], citations: [citation],
    } });
    store.saveRun({ conversationId: other.id, repository: { ...repository, repo: "other" },
      question: "How does caching work?", result: { answer: "Other repository.", status: "answered" } });
    assert.equal(store.searchHistory("EXAMPLE/PROJECT", "caching").length, 2);
    assert.equal(store.searchHistory("example/project", "other repository").length, 0);
    const findings = store.getPriorFindings("example/project", "caching readme");
    assert.equal(findings.length, 1);
    assert.equal(findings[0].conversationId, first.id);
    assert.equal(findings[0].sha, repository.sha);
    assert.equal(findings[0].evidence[0].path, "README.md");
    store.close();
  } finally { f.cleanup(); }
});

test("prior findings include inspected paths even when no answer was cited", () => {
  const f = fixture();
  try {
    const store = createHistoryStore({ dbPath: f.dbPath });
    const conversation = store.createConversation("example/project");
    store.saveRun({ conversationId: conversation.id, repository, question: "Where is caching configured?", result: {
      answer: "The inspected source was insufficient.", status: "insufficient_evidence",
      inspectedPaths: [{ path: "config/cache.ts", outcome: "read" }],
    } });
    const findings = store.getPriorFindings("example/project", "caching configuration");
    assert.equal(findings.length, 1);
    assert.equal(findings[0].conversationId, conversation.id);
    assert.deepEqual(findings[0].inspectedPaths, [{ path: "config/cache.ts", outcome: "read" }]);
    assert.deepEqual(findings[0].citations, []);
    store.close();
  } finally { f.cleanup(); }
});

test("deleting a source conversation preserves a copied citation in another run", () => {
  const f = fixture();
  try {
    const store = createHistoryStore({ dbPath: f.dbPath });
    const source = store.createConversation("example/project");
    const reused = store.createConversation("example/project");
    const originalRun = store.saveRun({ conversationId: source.id, repository,
      question: "Where?", result: { answer: "README.", status: "answered", evidence: [evidence], citations: [citation] } });
    store.saveRun({ conversationId: reused.id, repository,
      question: "Again?", result: { answer: "README again.", status: "answered",
        evidence: [{ ...evidence, sourceConversationId: source.id, sourceRunId: originalRun.id }],
        citations: [citation] } });
    assert.equal(store.deleteConversation(source.id), true);
    assert.equal(store.getConversation(source.id), null);
    assert.equal(store.searchHistory("example/project", "Where?").length, 0);
    const remaining = store.getConversation(reused.id);
    assert.ok(remaining);
    assert.equal(remaining.runs[0].citations[0].evidenceId, evidence.id);
    assert.equal(remaining.runs[0].evidence[0].excerpt, evidence.excerpt);
    assert.equal(remaining.runs[0].evidence[0].sourceConversationId, source.id);
    store.close();
  } finally { f.cleanup(); }
});

test("reopening preserves mode, changed state, and typed error", () => {
  const f = fixture();
  try {
    let store = createHistoryStore({ dbPath: f.dbPath });
    const conversation = store.createConversation("example/project");
    store.saveRun({ conversationId: conversation.id, repository, question: "Did the source change?", result: {
      answer: "Refresh failed.", status: "insufficient_evidence", mode: "provider",
      changed: true, error: "source_unavailable", inspectedPaths: [{ path: "README.md", outcome: "missing" }],
    } });
    store.close();
    store = createHistoryStore({ dbPath: f.dbPath });
    const reopened = store.getConversation(conversation.id);
    assert.ok(reopened);
    const run = reopened.runs[0];
    assert.equal(run.mode, "provider");
    assert.equal(run.changed, true);
    assert.equal(run.error, "source_unavailable");
    const prior = store.getPriorFindings("example/project", "source change");
    assert.equal(prior.length, 1);
    assert.deepEqual(prior[0].inspectedPaths, [{ path: "README.md", outcome: "missing" }]);
    assert.deepEqual(prior[0].citations, []);
    assert.equal(store.searchHistory("example/project", "Refresh failed").length, 1);
    store.close();
  } finally { f.cleanup(); }
});

test("version 1 database migrates to version 2 without losing saved runs", () => {
  const f = fixture();
  try {
    let store = createHistoryStore({ dbPath: f.dbPath });
    const conversation = store.createConversation("example/project");
    store.saveRun({ conversationId: conversation.id, repository, question: "Legacy question", result: {
      answer: "Legacy answer", status: "answered", evidence: [evidence], citations: [citation],
    } });
    store.close();
    const db = new DatabaseSync(f.dbPath);
    db.exec("ALTER TABLE runs DROP COLUMN mode; ALTER TABLE runs DROP COLUMN changed; ALTER TABLE runs DROP COLUMN error; PRAGMA user_version = 1;");
    db.close();
    store = createHistoryStore({ dbPath: f.dbPath });
    const reopened = store.getConversation(conversation.id);
    assert.ok(reopened);
    assert.equal(reopened.runs[0].citations.length, 1);
    assert.equal(reopened.messages[1].text, "Legacy answer");
    store.close();
    const migrated = new DatabaseSync(f.dbPath);
    assert.equal(migrated.prepare("PRAGMA user_version").get()?.user_version, 2);
    migrated.close();
  } finally { f.cleanup(); }
});

