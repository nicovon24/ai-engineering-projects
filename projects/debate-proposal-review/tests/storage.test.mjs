import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { createReview, deleteReview, getReview, listReviews, StorageError, updateReview } from "../src/lib/server/storage.ts";

test("persists, lists, reloads, and deletes a local review", async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "dpr-storage-"));
  process.env.DPR_DATA_DIR = dir;
  try {
    const created = await createReview("es");
    assert.match(created.id, /^[0-9a-f-]{36}$/);
    assert.equal(created.stage, "draft");
    assert.deepEqual(created.sources, []);
    assert.deepEqual(created.messages, []);
    assert.deepEqual(created.stageOutputs, {});
    assert.deepEqual(created.proposal, { title: "", summary: "" });
    await updateReview(created.id, (record) => ({ ...record, proposal: { title: "Plan", summary: "Draft" } }));
    assert.equal((await getReview(created.id)).proposal.title, "Plan");
    assert.equal((await listReviews()).length, 1);
    await deleteReview(created.id);
    assert.deepEqual(await listReviews(), []);
    await assert.rejects(() => getReview(created.id), (error) => error instanceof StorageError && error.code === "NOT_FOUND");
  } finally {
    delete process.env.DPR_DATA_DIR;
    await rm(dir, { recursive: true, force: true });
  }
});

test("rejects traversal IDs and serializes concurrent updates and deletion", async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "dpr-storage-"));
  process.env.DPR_DATA_DIR = dir;
  try {
    await assert.rejects(() => getReview("../escape"), (error) => error instanceof StorageError && error.code === "INVALID_ID" && !error.message.includes(dir));
    const created = await createReview("en");
    const first = updateReview(created.id, async (record) => {
      await new Promise((resolve) => setTimeout(resolve, 15));
      return { ...record, proposal: { ...record.proposal, title: "first" } };
    });
    const second = updateReview(created.id, (record) => ({ ...record, proposal: { ...record.proposal, summary: "second" } }));
    await Promise.all([first, second]);
    assert.deepEqual((await getReview(created.id)).proposal, { title: "first", summary: "second" });
    await Promise.all([deleteReview(created.id), assert.rejects(() => updateReview(created.id, (record) => record), (error) => error instanceof StorageError && error.code === "NOT_FOUND")]);
    assert.deepEqual(await listReviews(), []);
  } finally {
    delete process.env.DPR_DATA_DIR;
    await rm(dir, { recursive: true, force: true });
  }
});
