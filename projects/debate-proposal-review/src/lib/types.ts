import type { ReviewSnapshot } from "./review-contract";

export type Locale = "es" | "en";
export type SourceDocument = ReviewSnapshot["sources"][number] & {
  title: string;
  filename?: string;
  format: "text" | "txt" | "md" | "pdf" | "docx";
};
export type Message = { id: string; role: "user" | "assistant"; content: string };
export type Proposal = { title: string; summary: string };
export type HumanDecision = {
  outcome: "approve" | "reject" | "defer";
  rationale: string;
  conditions: string;
  updatedAt: string;
  evidenceSnapshotId: string;
};
export type ReviewStage = "draft" | "claims" | "supporting" | "opposing" | "evidence" | "synthesis" | "complete";
export type ReviewRecord = {
  id: string;
  locale: Locale;
  createdAt: string;
  updatedAt: string;
  consentAt?: string;
  proposal: Proposal;
  messages: Message[];
  sources: SourceDocument[];
  stage: ReviewStage;
  stageOutputs: Record<string, unknown>;
  snapshot?: ReviewSnapshot;
  snapshotId?: string;
  synthesis?: { summary: string; questions: { question: string; neededEvidence: string }[] };
  decision?: HumanDecision;
  error?: string;
};
