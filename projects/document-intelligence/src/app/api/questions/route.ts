import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { generateAnswer, generateGeneralAnswer } from "@/lib/answer";
import { AppError } from "@/lib/errors";
import { MAX_QUESTIONS } from "@/lib/limits";
import { expandGroundedNames, isOverviewQuestion } from "@/lib/retrieval";
import { prepareSemanticSearch, retrieveHybrid } from "@/lib/semantic-search";
import { rewriteSearches } from "@/lib/query-rewrite";
import { addQuestion, readWorkspace, releaseQuestion, reserveQuestion, SESSION_COOKIE } from "@/lib/storage";
import type { QuestionRecord } from "@/lib/types";

export const runtime = "nodejs";

const requestSchema = z.object({
  question: z.string().trim().min(3).max(1000),
  locale: z.enum(["es", "en"]),
});

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (origin) {
    let validOrigin = false;
    try {
      const parsedOrigin = new URL(origin);
      validOrigin = (parsedOrigin.protocol === "http:" || parsedOrigin.protocol === "https:") &&
        parsedOrigin.host === request.headers.get("host");
    } catch {
      // A malformed Origin is an invalid request, not a server error.
    }
    if (!validOrigin) return NextResponse.json({ error: "invalid_origin" }, { status: 403 });
  }

  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid_question" }, { status: 400 });

  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE)?.value;
    if (!token) throw new AppError("session_expired");
    const currentWorkspace = await readWorkspace(token);
    if (!currentWorkspace) throw new AppError("session_expired");
    if (currentWorkspace.documents.length === 0) throw new AppError("no_documents");
    if (currentWorkspace.questions.length >= MAX_QUESTIONS) throw new AppError("question_limit");
    // Cold model loading and legacy index backfill happen before the two-minute question reservation.
    const prepared = isOverviewQuestion(parsed.data.question) ? null :
      await prepareSemanticSearch(token, currentWorkspace, parsed.data.question).catch(() => null);
    const { workspace, reservationId } = await reserveQuestion(token);
    try {
      const rewrites = process.env.GROQ_API_KEY && !isOverviewQuestion(parsed.data.question)
        ? await rewriteSearches(parsed.data.question, parsed.data.locale)
        : [];
      const { passages, mode } = await retrieveHybrid(workspace, parsed.data.question, rewrites, prepared);
      const nicknameUsedAsSearchHint = expandGroundedNames(workspace, parsed.data.question) !== parsed.data.question;
      const answer = await generateAnswer(parsed.data.question, parsed.data.locale, passages, nicknameUsedAsSearchHint);
      let generalAnswer: QuestionRecord["generalAnswer"] = null;
      if (process.env.GROQ_API_KEY && answer.status === "insufficient_evidence") {
        try {
          generalAnswer = await generateGeneralAnswer(parsed.data.question, parsed.data.locale);
        } catch {
          // A general response is optional; preserve the documentary abstention if it fails.
        }
      }
      const record: QuestionRecord = {
        id: randomUUID(),
        question: parsed.data.question,
        locale: parsed.data.locale,
        askedAt: new Date().toISOString(),
        status: answer.status,
        claims: answer.claims,
        passageIds: passages.map((passage) => passage.id),
        retrievalMode: mode,
        ...(generalAnswer ? { generalAnswer } : {}),
      };
      await addQuestion(token, reservationId, record);
      cookieStore.set(SESSION_COOKIE, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 24 * 60 * 60,
      });
      return NextResponse.json({ record }, { headers: { "Cache-Control": "no-store" } });
    } finally {
      await releaseQuestion(token, reservationId).catch(() => {
        // A missing workspace cannot retain a reservation; stale ones expire on the next request.
      });
    }
  } catch (error) {
    const code = error instanceof AppError ? error.code : "unexpected_error";
    const status = code === "provider_limited" ? 429 : code === "session_expired" ? 401 : code === "question_limit" ? 429 : 400;
    return NextResponse.json({ error: code }, { status, headers: { "Cache-Control": "no-store" } });
  }
}
