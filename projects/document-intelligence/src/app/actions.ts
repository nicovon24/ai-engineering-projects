"use server";

import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { AppError } from "@/lib/errors";
import { parseDocument } from "@/lib/parse-document";
import { addDocument, createWorkspace, readWorkspace, removeDocument, removeWorkspace, SESSION_COOKIE } from "@/lib/storage";
import type { Locale } from "@/lib/types";

type ActionResult = { ok: true } | { ok: false; error: string };

async function setSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 24 * 60 * 60,
  });
}

function failure(error: unknown): ActionResult {
  return { ok: false, error: error instanceof AppError ? error.code : "unexpected_error" };
}

export async function uploadDocument(formData: FormData): Promise<ActionResult> {
  try {
    const file = formData.get("file");
    if (!(file instanceof File)) throw new AppError("no_file");
    const document = await parseDocument(file, randomUUID());
    const cookieStore = await cookies();
    let token = cookieStore.get(SESSION_COOKIE)?.value;
    if (!await readWorkspace(token)) {
      const created = await createWorkspace();
      token = created.token;
    }
    await addDocument(token!, document, Buffer.from(await file.arrayBuffer()));
    await setSessionCookie(token!);
    revalidatePath("/");
    return { ok: true };
  } catch (error) {
    return failure(error);
  }
}

export async function deleteDocument(documentId: string): Promise<ActionResult> {
  try {
    const token = (await cookies()).get(SESSION_COOKIE)?.value;
    if (!token) throw new AppError("session_expired");
    await removeDocument(token, documentId);
    await setSessionCookie(token);
    revalidatePath("/");
    return { ok: true };
  } catch (error) {
    return failure(error);
  }
}

export async function deleteWorkspace(): Promise<ActionResult> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE)?.value;
    if (token) await removeWorkspace(token);
    cookieStore.delete(SESSION_COOKIE);
    revalidatePath("/");
    return { ok: true };
  } catch (error) {
    return failure(error);
  }
}

export async function setLocale(value: Locale): Promise<ActionResult> {
  if (value !== "es" && value !== "en") return { ok: false, error: "invalid_locale" };
  (await cookies()).set("document_intelligence_locale", value, {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 365 * 24 * 60 * 60,
  });
  revalidatePath("/");
  return { ok: true };
}
