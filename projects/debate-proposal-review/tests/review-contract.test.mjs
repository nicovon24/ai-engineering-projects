import assert from "node:assert/strict";
import test from "node:test";
import { ReviewValidationError, validateReviewSnapshot } from "../src/lib/review-contract.ts";

function snapshot() {
  return {
    reviewId: "review-1",
    sources: [{ id: "source-1", reviewId: "review-1", passages: [{ id: "passage-1", sourceId: "source-1", locator: "page 1", text: "An observed result." }] }],
    arguments: [{ id: "argument-1", perspective: "supporting", text: "The result helps.", claimIds: ["claim-1"] }],
    claims: [
      { id: "claim-1", text: "The result occurred.", origins: ["proposal", "supporting"], kind: "factual", argumentIds: ["argument-1"] },
      { id: "claim-2", text: "This is desirable.", origins: ["proposal"], kind: "value_judgment", argumentIds: [] },
    ],
    verdicts: [{ claimId: "claim-1", status: "supported", supportingPassageIds: ["passage-1"], contradictingPassageIds: [], rationale: "The passage describes the result." }],
  };
}

function failsWithCode(value, code) {
  assert.throws(() => validateReviewSnapshot(value), (error) => error instanceof ReviewValidationError && error.code === code);
}

test("accepts a review-scoped snapshot with a factual verdict and a value judgment", () => {
  const value = snapshot();
  assert.deepEqual(validateReviewSnapshot(value), value);
});

test("rejects a citation from another review or an unknown passage", () => {
  const foreign = snapshot();
  foreign.sources.push({ id: "source-2", reviewId: "review-2", passages: [{ id: "foreign", sourceId: "source-2", locator: "page 2", text: "Other review." }] });
  foreign.verdicts[0].supportingPassageIds = ["foreign"];
  failsWithCode(foreign, "INVALID_OWNERSHIP");

  const unknown = snapshot();
  unknown.verdicts[0].supportingPassageIds = ["missing"];
  failsWithCode(unknown, "UNRESOLVED_REFERENCE");
});

test("rejects duplicate review-scoped source, passage, claim, argument, and verdict IDs", () => {
  for (const field of ["sources", "claims", "arguments", "verdicts"]) {
    const value = snapshot();
    value[field].push(structuredClone(value[field][0]));
    failsWithCode(value, "DUPLICATE_ID");
  }
  const value = snapshot();
  value.sources[0].passages.push(structuredClone(value.sources[0].passages[0]));
  failsWithCode(value, "DUPLICATE_ID");
});

test("rejects invalid origins and one-sided argument links", () => {
  const invalidOrigin = snapshot();
  invalidOrigin.claims[0].origins = ["proposal", "imagined"];
  failsWithCode(invalidOrigin, "INVALID_SHAPE");

  const missingClaimLink = snapshot();
  missingClaimLink.arguments[0].claimIds = [];
  failsWithCode(missingClaimLink, "INVALID_LINK");

  const missingArgumentLink = snapshot();
  missingArgumentLink.claims[0].argumentIds = [];
  failsWithCode(missingArgumentLink, "INVALID_LINK");

  const mismatchedOrigin = snapshot();
  mismatchedOrigin.claims[0].origins = ["proposal", "opposing"];
  failsWithCode(mismatchedOrigin, "INVALID_LINK");
});

test("requires exactly one verdict for each factual claim and none for value judgments", () => {
  const valueVerdict = snapshot();
  valueVerdict.verdicts.push({ claimId: "claim-2", status: "supported", supportingPassageIds: ["passage-1"], contradictingPassageIds: [], rationale: "No." });
  failsWithCode(valueVerdict, "INVALID_VERDICT");

  const missingVerdict = snapshot();
  missingVerdict.verdicts = [];
  failsWithCode(missingVerdict, "INVALID_VERDICT");
});

test("permits mixed evidence and explicit insufficient evidence without a passage", () => {
  const mixed = snapshot();
  mixed.sources[0].passages.push({ id: "passage-2", sourceId: "source-1", locator: "page 2", text: "A conflicting observation." });
  mixed.verdicts[0] = { claimId: "claim-1", status: "mixed", supportingPassageIds: ["passage-1"], contradictingPassageIds: ["passage-2"], rationale: "The passages conflict." };
  assert.deepEqual(validateReviewSnapshot(mixed), mixed);

  const insufficient = snapshot();
  insufficient.verdicts[0] = { claimId: "claim-1", status: "insufficient", supportingPassageIds: [], contradictingPassageIds: [], rationale: "No relevant passage was found.", noRelevantPassage: true };
  assert.deepEqual(validateReviewSnapshot(insufficient), insufficient);

  delete insufficient.verdicts[0].noRelevantPassage;
  failsWithCode(insufficient, "INVALID_VERDICT");
});
