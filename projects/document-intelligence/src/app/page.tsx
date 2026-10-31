import { cookies } from "next/headers";
import { readWorkspace, SESSION_COOKIE } from "@/lib/storage";
import type { Locale, PublicWorkspace } from "@/lib/types";
import { Workspace } from "./workspace";

export const dynamic = "force-dynamic";

export default async function Home() {
  const cookieStore = await cookies();
  const locale: Locale = cookieStore.get("document_intelligence_locale")?.value === "en" ? "en" : "es";
  const stored = await readWorkspace(cookieStore.get(SESSION_COOKIE)?.value);
  const workspace: PublicWorkspace | null = stored ? {
    expiresAt: stored.expiresAt,
    documents: stored.documents,
    questions: stored.questions,
  } : null;
  return <Workspace locale={locale} workspace={workspace} aiConfigured={Boolean(process.env.GROQ_API_KEY)} />;
}
