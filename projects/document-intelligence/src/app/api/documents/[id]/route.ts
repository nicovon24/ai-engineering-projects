import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getDocumentBytes, SESSION_COOKIE } from "@/lib/storage";

export const runtime = "nodejs";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return new NextResponse(null, { status: 404 });
  const { id } = await context.params;
  const result = await getDocumentBytes(token, id);
  if (!result) return new NextResponse(null, { status: 404 });
  return new NextResponse(new Uint8Array(result.bytes), {
    headers: {
      "Content-Type": result.document.mediaType,
      "Content-Disposition": `attachment; filename="document.${result.document.extension}"; filename*=UTF-8''${encodeURIComponent(result.document.name)}`,
      "Content-Length": String(result.bytes.length),
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
