import { handleReviewRequest } from "@/lib/server/service";

export const runtime = "nodejs";

type Context = { params: Promise<{ id: string; action: string }> };

export async function POST(request: Request, { params }: Context): Promise<Response> {
  const { id, action } = await params;
  return handleReviewRequest(request, id, action);
}
