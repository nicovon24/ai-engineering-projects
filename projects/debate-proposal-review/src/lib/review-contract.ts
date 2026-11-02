export type ClaimOrigin = "proposal" | "supporting" | "opposing";
export type ClaimKind = "factual" | "value_judgment";
export type EvidenceStatus = "supported" | "contradicted" | "mixed" | "insufficient";

export type ReviewSnapshot = {
  reviewId: string;
  sources: {
    id: string;
    reviewId: string;
    passages: { id: string; sourceId: string; locator: string; text: string }[];
  }[];
  arguments: { id: string; perspective: "supporting" | "opposing"; text: string; claimIds: string[] }[];
  claims: { id: string; text: string; origins: ClaimOrigin[]; kind: ClaimKind; argumentIds: string[] }[];
  verdicts: {
    claimId: string;
    status: EvidenceStatus;
    supportingPassageIds: string[];
    contradictingPassageIds: string[];
    rationale: string;
    noRelevantPassage?: boolean;
  }[];
};

export type ReviewValidationCode = "INVALID_SHAPE" | "DUPLICATE_ID" | "INVALID_OWNERSHIP" | "UNRESOLVED_REFERENCE" | "INVALID_LINK" | "INVALID_VERDICT";

export class ReviewValidationError extends Error {
  readonly code: ReviewValidationCode;

  constructor(code: ReviewValidationCode, message: string) {
    super(message);
    this.name = "ReviewValidationError";
    this.code = code;
  }
}

function fail(code: ReviewValidationCode, message: string): never {
  throw new ReviewValidationError(code, message);
}

function record(value: unknown, name: string): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) fail("INVALID_SHAPE", `${name} must be an object`);
  return value as Record<string, unknown>;
}

function string(value: unknown, name: string, max = 4000): string {
  if (typeof value !== "string" || value.trim().length === 0 || value.length > max) fail("INVALID_SHAPE", `${name} must be a nonempty bounded string`);
  return value;
}

function list(value: unknown, name: string, max: number): unknown[] {
  if (!Array.isArray(value) || value.length > max) fail("INVALID_SHAPE", `${name} must be a bounded array`);
  return value;
}

function ids(value: unknown, name: string, max: number): string[] {
  const result = list(value, name, max).map((item, index) => string(item, `${name}[${index}]`, 120));
  if (new Set(result).size !== result.length) fail("DUPLICATE_ID", `${name} contains duplicate IDs`);
  return result;
}

function unique<T extends { id: string }>(items: T[], name: string): Map<string, T> {
  const result = new Map<string, T>();
  for (const item of items) {
    if (result.has(item.id)) fail("DUPLICATE_ID", `${name} contains ${item.id} twice`);
    result.set(item.id, item);
  }
  return result;
}

/** Checks syntax and review scope. It cannot establish that a passage supports a claim. */
export function validateReviewSnapshot(input: unknown): ReviewSnapshot {
  const root = record(input, "snapshot");
  const reviewId = string(root.reviewId, "reviewId", 120);
  const sources = list(root.sources, "sources", 20).map((item, index) => {
    const source = record(item, `sources[${index}]`);
    const id = string(source.id, "source.id", 120);
    const owner = string(source.reviewId, "source.reviewId", 120);
    const passages = list(source.passages, "source.passages", 50).map((entry, passageIndex) => {
      const passage = record(entry, `passages[${passageIndex}]`);
      return {
        id: string(passage.id, "passage.id", 120),
        sourceId: string(passage.sourceId, "passage.sourceId", 120),
        locator: string(passage.locator, "passage.locator", 200),
        text: string(passage.text, "passage.text", 10000),
      };
    });
    return { id, reviewId: owner, passages };
  });
  unique(sources, "sources");
  const passageById = unique(sources.flatMap((source) => source.passages), "passages");
  for (const source of sources) {
    if (source.reviewId !== reviewId) fail("INVALID_OWNERSHIP", `Source ${source.id} belongs to another review`);
    for (const passage of source.passages) {
      if (passage.sourceId !== source.id) fail("INVALID_OWNERSHIP", `Passage ${passage.id} belongs to another source`);
    }
  }

  const args = list(root.arguments, "arguments", 30).map((item, index) => {
    const arg = record(item, `arguments[${index}]`);
    if (arg.perspective !== "supporting" && arg.perspective !== "opposing") fail("INVALID_SHAPE", "Invalid argument perspective");
    return { id: string(arg.id, "argument.id", 120), perspective: arg.perspective, text: string(arg.text, "argument.text"), claimIds: ids(arg.claimIds, "argument.claimIds", 30) };
  });
  const argumentById = unique(args, "arguments");
  const claims = list(root.claims, "claims", 100).map((item, index) => {
    const claim = record(item, `claims[${index}]`);
    const origins = list(claim.origins, "claim.origins", 3);
    if (origins.length === 0 || origins.some((origin) => origin !== "proposal" && origin !== "supporting" && origin !== "opposing") || new Set(origins).size !== origins.length) fail("INVALID_SHAPE", "Invalid claim origins");
    if (claim.kind !== "factual" && claim.kind !== "value_judgment") fail("INVALID_SHAPE", "Invalid claim kind");
    return { id: string(claim.id, "claim.id", 120), text: string(claim.text, "claim.text"), origins: origins as ClaimOrigin[], kind: claim.kind, argumentIds: ids(claim.argumentIds, "claim.argumentIds", 30) };
  });
  const claimById = unique(claims, "claims");
  for (const arg of args) {
    for (const claimId of arg.claimIds) {
      const claim = claimById.get(claimId);
      if (!claim || !claim.argumentIds.includes(arg.id) || !claim.origins.includes(arg.perspective as ClaimOrigin)) fail("INVALID_LINK", `Argument ${arg.id} has an invalid claim link`);
    }
  }
  for (const claim of claims) {
    for (const argumentId of claim.argumentIds) {
      const arg = argumentById.get(argumentId);
      if (!arg || !arg.claimIds.includes(claim.id)) fail("INVALID_LINK", `Claim ${claim.id} has an invalid argument link`);
    }
    for (const origin of claim.origins) {
      if (origin !== "proposal" && !claim.argumentIds.some((id) => argumentById.get(id)?.perspective === origin)) fail("INVALID_LINK", `Claim ${claim.id} has an unlinked origin`);
    }
  }

  const verdicts = list(root.verdicts, "verdicts", 100).map((item, index) => {
    const verdict = record(item, `verdicts[${index}]`);
    if (verdict.status !== "supported" && verdict.status !== "contradicted" && verdict.status !== "mixed" && verdict.status !== "insufficient") fail("INVALID_VERDICT", "Invalid verdict status");
    if (verdict.noRelevantPassage !== undefined && typeof verdict.noRelevantPassage !== "boolean") fail("INVALID_VERDICT", "Invalid noRelevantPassage flag");
    const supportingPassageIds = ids(verdict.supportingPassageIds, "verdict.supportingPassageIds", 50);
    const contradictingPassageIds = ids(verdict.contradictingPassageIds, "verdict.contradictingPassageIds", 50);
    return {
      claimId: string(verdict.claimId, "verdict.claimId", 120),
      status: verdict.status,
      supportingPassageIds,
      contradictingPassageIds,
      rationale: string(verdict.rationale, "verdict.rationale"),
      ...(verdict.noRelevantPassage === undefined ? {} : { noRelevantPassage: verdict.noRelevantPassage }),
    };
  });
  const verdictClaims = new Set<string>();
  for (const verdict of verdicts) {
    if (verdictClaims.has(verdict.claimId)) fail("DUPLICATE_ID", `Duplicate verdict for ${verdict.claimId}`);
    verdictClaims.add(verdict.claimId);
    const claim = claimById.get(verdict.claimId);
    if (!claim || claim.kind !== "factual") fail("INVALID_VERDICT", `Verdict ${verdict.claimId} has no factual claim`);
    const cited = [...verdict.supportingPassageIds, ...verdict.contradictingPassageIds];
    if (new Set(cited).size !== cited.length) fail("DUPLICATE_ID", `Verdict ${verdict.claimId} repeats a passage`);
    for (const id of cited) {
      if (!passageById.has(id)) fail("UNRESOLVED_REFERENCE", `Verdict ${verdict.claimId} cites unknown passage ${id}`);
    }
    const hasSupport = verdict.supportingPassageIds.length > 0;
    const hasContradiction = verdict.contradictingPassageIds.length > 0;
    if ((verdict.status === "supported" && !hasSupport) || (verdict.status === "contradicted" && !hasContradiction) || (verdict.status === "mixed" && (!hasSupport || !hasContradiction)) || (!cited.length && (verdict.status !== "insufficient" || verdict.noRelevantPassage !== true)) || (cited.length > 0 && verdict.noRelevantPassage === true)) fail("INVALID_VERDICT", `Verdict ${verdict.claimId} has inconsistent passage fields`);
  }
  for (const claim of claims) {
    if (claim.kind === "factual" && !verdictClaims.has(claim.id)) fail("INVALID_VERDICT", `Factual claim ${claim.id} needs a verdict`);
  }
  return input as ReviewSnapshot;
}
