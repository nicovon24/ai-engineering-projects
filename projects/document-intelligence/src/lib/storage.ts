import { randomBytes, randomUUID } from "node:crypto";
import { mkdir, open, readFile, rename, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { AppError } from "./errors";
import { MAX_DOCUMENTS, MAX_QUESTIONS, WORKSPACE_TTL_MS } from "./limits";
import type { DocumentRecord, QuestionRecord, WorkspaceRecord } from "./types";

export const SESSION_COOKIE = "document_intelligence_session";
const dataRoot = path.join(process.cwd(), ".data", "workspaces");
const tokenPattern = /^[a-f0-9]{64}$/;
const idPattern = /^[a-f0-9-]{36}$/;
const QUESTION_RESERVATION_TTL_MS = 2 * 60 * 1000;

function workspacePath(token: string): string {
  if (!tokenPattern.test(token)) throw new AppError("invalid_session");
  return path.join(dataRoot, token);
}

function filePath(token: string, document: DocumentRecord): string {
  if (!idPattern.test(document.id)) throw new AppError("invalid_file");
  return path.join(workspacePath(token), "files", `${document.id}.${document.extension}`);
}

function nextExpiry(): string {
  return new Date(Date.now() + WORKSPACE_TTL_MS).toISOString();
}

async function writeWorkspace(token: string, workspace: WorkspaceRecord): Promise<void> {
  const directory = workspacePath(token);
  const temporary = path.join(directory, `workspace-${randomUUID()}.tmp`);
  await writeFile(temporary, JSON.stringify(workspace), { encoding: "utf8", mode: 0o600 });
  await rename(temporary, path.join(directory, "workspace.json"));
}

async function readWorkspaceRaw(token: string): Promise<WorkspaceRecord | null> {
  try {
    return JSON.parse(await readFile(path.join(workspacePath(token), "workspace.json"), "utf8")) as WorkspaceRecord;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
}

export async function readWorkspace(token: string | undefined): Promise<WorkspaceRecord | null> {
  if (!token || !tokenPattern.test(token)) return null;
  const workspace = await readWorkspaceRaw(token);
  if (!workspace) return null;
  if (Date.parse(workspace.expiresAt) <= Date.now()) {
    await rm(workspacePath(token), { recursive: true, force: true });
    return null;
  }
  return workspace;
}

export async function createWorkspace(): Promise<{ token: string; workspace: WorkspaceRecord }> {
  const token = randomBytes(32).toString("hex");
  const now = new Date().toISOString();
  const workspace: WorkspaceRecord = {
    createdAt: now,
    lastActiveAt: now,
    expiresAt: nextExpiry(),
    documents: [],
    questions: [],
  };
  await mkdir(path.join(workspacePath(token), "files"), { recursive: true, mode: 0o700 });
  await writeWorkspace(token, workspace);
  return { token, workspace };
}

async function withWorkspaceLock<T>(token: string, operation: () => Promise<T>): Promise<T> {
  const lockPath = path.join(workspacePath(token), "workspace.lock");
  for (let attempt = 0; attempt < 100; attempt++) {
    try {
      const handle = await open(lockPath, "wx");
      try {
        return await operation();
      } finally {
        await handle.close();
        await rm(lockPath, { force: true });
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
      const details = await stat(lockPath).catch(() => null);
      if (details && Date.now() - details.mtimeMs > 30_000) {
        await rm(lockPath, { force: true });
      }
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  }
  throw new AppError("workspace_busy");
}

function renew(workspace: WorkspaceRecord): void {
  workspace.lastActiveAt = new Date().toISOString();
  workspace.expiresAt = nextExpiry();
}

export async function addDocument(token: string, document: DocumentRecord, bytes: Buffer): Promise<WorkspaceRecord> {
  return withWorkspaceLock(token, async () => {
    const workspace = await readWorkspace(token);
    if (!workspace) throw new AppError("session_expired");
    if (workspace.documents.length >= MAX_DOCUMENTS) throw new AppError("document_limit");
    await writeFile(filePath(token, document), bytes, { flag: "wx", mode: 0o600 });
    workspace.documents.push(document);
    renew(workspace);
    try {
      await writeWorkspace(token, workspace);
    } catch (error) {
      await rm(filePath(token, document), { force: true });
      throw error;
    }
    return workspace;
  });
}

export async function removeDocument(token: string, documentId: string): Promise<WorkspaceRecord> {
  return withWorkspaceLock(token, async () => {
    const workspace = await readWorkspace(token);
    if (!workspace) throw new AppError("session_expired");
    const document = workspace.documents.find((item) => item.id === documentId);
    if (!document) throw new AppError("document_not_found");
    workspace.documents = workspace.documents.filter((item) => item.id !== documentId);
    workspace.questions = [];
    workspace.pendingQuestions = [];
    await writeWorkspace(token, workspace);
    await rm(filePath(token, document), { force: true });
    return workspace;
  });
}

export async function reserveQuestion(token: string): Promise<{ workspace: WorkspaceRecord; reservationId: string }> {
  return withWorkspaceLock(token, async () => {
    const workspace = await readWorkspace(token);
    if (!workspace) throw new AppError("session_expired");
    if (workspace.documents.length === 0) throw new AppError("no_documents");
    const now = Date.now();
    workspace.pendingQuestions = (workspace.pendingQuestions ?? []).filter((reservation) =>
      Date.parse(reservation.reservedAt) > now - QUESTION_RESERVATION_TTL_MS,
    );
    if (workspace.questions.length + workspace.pendingQuestions.length >= MAX_QUESTIONS) {
      throw new AppError("question_limit");
    }
    const reservationId = randomUUID();
    workspace.pendingQuestions.push({ id: reservationId, reservedAt: new Date(now).toISOString() });
    await writeWorkspace(token, workspace);
    return { workspace, reservationId };
  });
}

export async function addQuestion(token: string, reservationId: string, record: QuestionRecord): Promise<WorkspaceRecord> {
  return withWorkspaceLock(token, async () => {
    const workspace = await readWorkspace(token);
    if (!workspace) throw new AppError("session_expired");
    if (!(workspace.pendingQuestions ?? []).some((reservation) => reservation.id === reservationId)) {
      throw new AppError("workspace_changed");
    }
    const availableIds = new Set(workspace.documents.flatMap((document) => document.passages.map((passage) => passage.id)));
    if (record.passageIds.some((id) => !availableIds.has(id)) ||
      record.claims.some((claim) => claim.passageIds.some((id) => !availableIds.has(id)))) {
      throw new AppError("workspace_changed");
    }
    workspace.pendingQuestions = workspace.pendingQuestions!.filter((reservation) => reservation.id !== reservationId);
    workspace.questions.push(record);
    renew(workspace);
    await writeWorkspace(token, workspace);
    return workspace;
  });
}

export async function releaseQuestion(token: string, reservationId: string): Promise<void> {
  await withWorkspaceLock(token, async () => {
    const workspace = await readWorkspace(token);
    if (!workspace?.pendingQuestions?.some((reservation) => reservation.id === reservationId)) return;
    workspace.pendingQuestions = workspace.pendingQuestions.filter((reservation) => reservation.id !== reservationId);
    await writeWorkspace(token, workspace);
  });
}

export async function getDocumentBytes(token: string, documentId: string): Promise<{ document: DocumentRecord; bytes: Buffer } | null> {
  const workspace = await readWorkspace(token);
  const document = workspace?.documents.find((item) => item.id === documentId);
  if (!document) return null;
  try {
    const bytes = await readFile(filePath(token, document));
    return { document, bytes };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
}

export async function removeWorkspace(token: string): Promise<void> {
  if (!tokenPattern.test(token)) return;
  await rm(workspacePath(token), { recursive: true, force: true });
}

export async function cleanupExpiredWorkspaces(): Promise<number> {
  const { readdir } = await import("node:fs/promises");
  const entries = await readdir(dataRoot, { withFileTypes: true }).catch(() => []);
  let removed = 0;
  for (const entry of entries) {
    if (!entry.isDirectory() || !tokenPattern.test(entry.name)) continue;
    const workspace = await readWorkspaceRaw(entry.name).catch(() => null);
    if (workspace && Date.parse(workspace.expiresAt) <= Date.now()) {
      await rm(workspacePath(entry.name), { recursive: true, force: true });
      removed++;
    }
  }
  return removed;
}
