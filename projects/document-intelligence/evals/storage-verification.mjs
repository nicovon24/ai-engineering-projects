import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import ts from "typescript";

const projectRoot = path.resolve(import.meta.dirname, "..");
const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), "di-storage-verification-"));
const originalCwd = process.cwd();
const results = [];

function checked(name, condition) {
  assert.ok(condition, name);
  results.push(name);
}

async function compileStorage() {
  for (const name of ["errors", "limits", "storage"]) {
    const source = await readFile(path.join(projectRoot, "src", "lib", `${name}.ts`), "utf8");
    const output = ts.transpileModule(source, {
      compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
      fileName: `${name}.ts`,
    }).outputText.replaceAll('from "./errors"', 'from "./errors.mjs"')
      .replaceAll('from "./limits"', 'from "./limits.mjs"');
    await writeFile(path.join(temporaryRoot, `${name}.mjs`), output);
  }
}

function makeDocument(id = randomUUID()) {
  const passageId = `${id}-passage`;
  return {
    id,
    name: "synthetic.txt",
    mediaType: "text/plain",
    extension: "txt",
    size: 9,
    pageCount: null,
    uploadedAt: new Date().toISOString(),
    passages: [{ id: passageId, documentId: id, text: "Local test", page: null, startOffset: 0, endOffset: 10 }],
  };
}

function makeQuestion(passageId, id = randomUUID()) {
  return {
    id,
    question: "What is in the source?",
    locale: "en",
    askedAt: new Date().toISOString(),
    status: "evidence_only",
    claims: [],
    passageIds: [passageId],
  };
}

async function expectCode(operation, code) {
  await assert.rejects(operation, (error) => error?.code === code);
}

function workspaceJsonPath(token) {
  return path.join(temporaryRoot, ".data", "workspaces", token, "workspace.json");
}

async function editWorkspace(token, edit) {
  const filename = workspaceJsonPath(token);
  const workspace = JSON.parse(await readFile(filename, "utf8"));
  edit(workspace);
  await writeFile(filename, JSON.stringify(workspace));
}

try {
  await compileStorage();
  process.chdir(temporaryRoot);
  const storage = await import(pathToFileURL(path.join(temporaryRoot, "storage.mjs")));
  const { MAX_QUESTIONS, WORKSPACE_TTL_MS } = await import(pathToFileURL(path.join(temporaryRoot, "limits.mjs")));
  const first = await storage.createWorkspace();
  const second = await storage.createWorkspace();
  const source = makeDocument();
  const otherSource = makeDocument();
  const beforeUpload = Date.now();
  await storage.addDocument(first.token, source, Buffer.from("Local test"));
  await storage.addDocument(second.token, otherSource, Buffer.from("Other test"));

  checked("successful upload starts a 24-hour expiry", Date.parse((await storage.readWorkspace(first.token)).expiresAt) >=
    beforeUpload + WORKSPACE_TTL_MS && Date.parse((await storage.readWorkspace(first.token)).expiresAt) <=
    Date.now() + WORKSPACE_TTL_MS);

  checked("unguessable session tokens differ", first.token !== second.token && /^[a-f0-9]{64}$/.test(first.token));
  checked("reads and downloads are scoped to the session token",
    (await storage.readWorkspace(first.token)).documents[0].id === source.id &&
    (await storage.getDocumentBytes(second.token, source.id)) === null &&
    (await storage.readWorkspace("invalid")) === null);
  await expectCode(() => storage.removeDocument(second.token, source.id), "document_not_found");
  checked("cross-session deletion is rejected", (await storage.readWorkspace(first.token)).documents.length === 1);

  const beforeReservations = await storage.readWorkspace(first.token);
  const reservationResults = await Promise.allSettled(
    Array.from({ length: MAX_QUESTIONS + 10 }, () => storage.reserveQuestion(first.token)),
  );
  const accepted = reservationResults.filter((result) => result.status === "fulfilled").map((result) => result.value);
  const rejected = reservationResults.filter((result) => result.status === "rejected");
  checked("20 concurrent reservations admit exactly 10", accepted.length === MAX_QUESTIONS &&
    rejected.length === MAX_QUESTIONS && rejected.every((result) => result.reason?.code === "question_limit"));
  checked("reservations do not renew expiry", (await storage.readWorkspace(first.token)).expiresAt === beforeReservations.expiresAt);

  await storage.releaseQuestion(first.token, accepted[0].reservationId);
  checked("failure release returns one slot", (await storage.reserveQuestion(first.token)).reservationId.length > 0);
  const pending = (await storage.readWorkspace(first.token)).pendingQuestions;
  checked("saved plus pending stays at 10", pending.length === MAX_QUESTIONS);

  const saveReservation = pending[0].id;
  const beforeSave = Date.now();
  await storage.addQuestion(first.token, saveReservation, makeQuestion(source.passages[0].id));
  const afterSave = await storage.readWorkspace(first.token);
  checked("saving consumes one slot and renews 24-hour expiry", afterSave.questions.length === 1 &&
    afterSave.pendingQuestions.length === MAX_QUESTIONS - 1 &&
    Date.parse(afterSave.expiresAt) >= beforeSave + WORKSPACE_TTL_MS &&
    Date.parse(afterSave.expiresAt) <= Date.now() + WORKSPACE_TTL_MS);
  await expectCode(() => storage.reserveQuestion(first.token), "question_limit");
  checked("saved plus pending limit rejects another reservation", true);

  const staleSourceReservation = afterSave.pendingQuestions[0].id;
  await expectCode(() => storage.addQuestion(first.token, staleSourceReservation,
    makeQuestion("missing-passage")), "workspace_changed");
  await storage.releaseQuestion(first.token, staleSourceReservation);
  checked("missing citation is rejected and released", (await storage.readWorkspace(first.token)).pendingQuestions.length === MAX_QUESTIONS - 2);

  await storage.removeDocument(first.token, source.id);
  await expectCode(() => storage.addQuestion(first.token, afterSave.pendingQuestions[1].id,
    makeQuestion(source.passages[0].id)), "workspace_changed");
  checked("document removal invalidates pending answers and clears history",
    (await storage.readWorkspace(first.token)).questions.length === 0 &&
    (await storage.readWorkspace(first.token)).pendingQuestions.length === 0 &&
    (await storage.getDocumentBytes(first.token, source.id)) === null);
  checked("document removal does not renew expiry",
    (await storage.readWorkspace(first.token)).expiresAt === afterSave.expiresAt);

  const pruning = await storage.createWorkspace();
  const pruningSource = makeDocument();
  await storage.addDocument(pruning.token, pruningSource, Buffer.from("Local test"));
  const oldReservation = await storage.reserveQuestion(pruning.token);
  await editWorkspace(pruning.token, (workspace) => {
    workspace.pendingQuestions[0].reservedAt = new Date(Date.now() - 2 * 60 * 1000 - 1).toISOString();
  });
  const beforeLateSave = await storage.readWorkspace(pruning.token);
  await expectCode(() => storage.addQuestion(pruning.token, oldReservation.reservationId,
    makeQuestion(pruningSource.passages[0].id)), "workspace_changed");
  const afterLateSave = await storage.readWorkspace(pruning.token);
  checked("expired reservation cannot save before pruning or renew expiry",
    afterLateSave.questions.length === 0 && afterLateSave.expiresAt === beforeLateSave.expiresAt &&
    afterLateSave.pendingQuestions.length === 1);
  await storage.releaseQuestion(pruning.token, oldReservation.reservationId);
  checked("failed late save can release its reservation", (await storage.readWorkspace(pruning.token)).pendingQuestions.length === 0);
  const nextOldReservation = await storage.reserveQuestion(pruning.token);
  await editWorkspace(pruning.token, (workspace) => {
    workspace.pendingQuestions[0].reservedAt = new Date(Date.now() - 2 * 60 * 1000 - 1).toISOString();
  });
  const freshReservation = await storage.reserveQuestion(pruning.token);
  await expectCode(() => storage.addQuestion(pruning.token, nextOldReservation.reservationId,
    makeQuestion(pruningSource.passages[0].id)), "workspace_changed");
  checked("new reservation prunes stale reservation and rejects late save",
    (await storage.readWorkspace(pruning.token)).pendingQuestions.length === 1 &&
    (await storage.readWorkspace(pruning.token)).pendingQuestions[0].id === freshReservation.reservationId);

  const secondBeforeRead = await storage.readWorkspace(second.token);
  await storage.getDocumentBytes(second.token, otherSource.id);
  await storage.readWorkspace(second.token);
  checked("read and download do not renew expiry", (await storage.readWorkspace(second.token)).expiresAt === secondBeforeRead.expiresAt);
  await editWorkspace(second.token, (workspace) => { workspace.expiresAt = new Date(Date.now() - 1).toISOString(); });
  checked("expired workspace is denied and deleted on access", (await storage.readWorkspace(second.token)) === null &&
    await readFile(workspaceJsonPath(second.token)).then(() => false, () => true));

  const manual = await storage.createWorkspace();
  const manualSource = makeDocument();
  await storage.addDocument(manual.token, manualSource, Buffer.from("Local test"));
  const manualFilePath = path.join(temporaryRoot, ".data", "workspaces", manual.token, "files", `${manualSource.id}.txt`);
  await storage.removeWorkspace(manual.token);
  checked("manual deletion removes workspace metadata and original bytes", (await storage.readWorkspace(manual.token)) === null &&
    await readFile(workspaceJsonPath(manual.token)).then(() => false, () => true) &&
    await readFile(manualFilePath).then(() => false, () => true));

  console.log(JSON.stringify({ passed: results.length, checks: results }, null, 2));
} finally {
  process.chdir(originalCwd);
  await rm(temporaryRoot, { recursive: true, force: true });
}
