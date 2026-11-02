import { randomUUID } from "node:crypto";
import { mkdir, readFile, readdir, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Locale, ReviewRecord } from "../types";

export type StorageErrorCode = "INVALID_ID" | "NOT_FOUND" | "STORAGE_ERROR";

export class StorageError extends Error {
  readonly code: StorageErrorCode;

  constructor(code: StorageErrorCode, message: string) {
    super(message);
    this.name = "StorageError";
    this.code = code;
  }
}

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const queues = new Map<string, Promise<unknown>>();

function fileFor(id: string): string {
  if (!uuidPattern.test(id)) throw new StorageError("INVALID_ID", "Invalid review ID");
  return path.join(process.env.DPR_DATA_DIR || path.join(process.cwd(), ".data", "reviews"), `${id}.json`);
}

function serialize<T>(id: string, operation: () => Promise<T>): Promise<T> {
  const prior = queues.get(id) ?? Promise.resolve();
  const current = prior.catch(() => undefined).then(operation);
  queues.set(id, current);
  void current.finally(() => {
    if (queues.get(id) === current) queues.delete(id);
  }).catch(() => undefined);
  return current;
}

function isMissing(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT";
}

async function writeAtomic(id: string, record: ReviewRecord): Promise<void> {
  const destination = fileFor(id);
  const temporary = `${destination}.${randomUUID()}.tmp`;
  try {
    await mkdir(path.dirname(destination), { recursive: true });
    await writeFile(temporary, JSON.stringify(record), { encoding: "utf8", flag: "wx" });
    await rename(temporary, destination);
  } catch {
    await rm(temporary, { force: true }).catch(() => undefined);
    throw new StorageError("STORAGE_ERROR", "Could not save review");
  }
}

export async function createReview(locale: Locale): Promise<ReviewRecord> {
  if (locale !== "es" && locale !== "en") throw new StorageError("STORAGE_ERROR", "Invalid locale");
  const id = randomUUID();
  const now = new Date().toISOString();
  const record: ReviewRecord = {
    id, locale, createdAt: now, updatedAt: now,
    proposal: { title: "", summary: "" }, messages: [], sources: [],
    stage: "draft", stageOutputs: {},
  };
  await serialize(id, () => writeAtomic(id, record));
  return record;
}

export async function getReview(id: string): Promise<ReviewRecord> {
  const filename = fileFor(id);
  try {
    const record = JSON.parse(await readFile(filename, "utf8")) as ReviewRecord;
    if (record.id !== id) throw new Error("Mismatched review ID");
    return record;
  } catch (error) {
    if (isMissing(error)) throw new StorageError("NOT_FOUND", "Review not found");
    throw new StorageError("STORAGE_ERROR", "Could not read review");
  }
}

export async function listReviews(): Promise<ReviewRecord[]> {
  const directory = path.dirname(fileFor(randomUUID()));
  let entries: string[];
  try {
    entries = await readdir(directory);
  } catch (error) {
    if (isMissing(error)) return [];
    throw new StorageError("STORAGE_ERROR", "Could not list reviews");
  }
  const records = await Promise.all(entries.filter((entry) => entry.endsWith(".json") && uuidPattern.test(entry.slice(0, -5))).map((entry) => getReview(entry.slice(0, -5))));
  return records.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function updateReview(id: string, updater: (record: ReviewRecord) => ReviewRecord | Promise<ReviewRecord>): Promise<ReviewRecord> {
  fileFor(id);
  return serialize(id, async () => {
    const previous = await getReview(id);
    const updated = await updater(previous);
    if (updated.id !== id || updated.createdAt !== previous.createdAt) throw new StorageError("STORAGE_ERROR", "Review identity cannot change");
    const next = { ...updated, updatedAt: new Date().toISOString() };
    await writeAtomic(id, next);
    return next;
  });
}

export async function deleteReview(id: string): Promise<void> {
  const filename = fileFor(id);
  return serialize(id, async () => {
    try {
      await rm(filename);
    } catch (error) {
      if (isMissing(error)) throw new StorageError("NOT_FOUND", "Review not found");
      throw new StorageError("STORAGE_ERROR", "Could not delete review");
    }
  });
}
