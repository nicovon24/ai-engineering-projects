export type Locale = "es" | "en";

export type Passage = {
  id: string;
  documentId: string;
  text: string;
  page: number | null;
  startOffset: number;
  endOffset: number;
};

export type DocumentRecord = {
  id: string;
  name: string;
  mediaType: string;
  extension: "pdf" | "txt" | "md" | "docx";
  size: number;
  pageCount: number | null;
  uploadedAt: string;
  passages: Passage[];
};

export type AnswerClaim = {
  text: string;
  passageIds: string[];
};

export type GeneralAnswer = {
  kind: "general" | "cannot_verify" | "current_data";
  text: string;
};

export type QuestionRecord = {
  id: string;
  question: string;
  locale: Locale;
  askedAt: string;
  status: "answered" | "insufficient_evidence" | "evidence_only";
  claims: AnswerClaim[];
  passageIds: string[];
  generalAnswer?: GeneralAnswer | null;
};

export type WorkspaceRecord = {
  createdAt: string;
  lastActiveAt: string;
  expiresAt: string;
  documents: DocumentRecord[];
  questions: QuestionRecord[];
  pendingQuestions?: { id: string; reservedAt: string }[];
};

export type PublicWorkspace = Pick<WorkspaceRecord, "expiresAt" | "documents" | "questions">;
