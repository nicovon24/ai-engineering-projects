import { handleReviewRequest } from "@/lib/server/service";

export const runtime = "nodejs";

type Context = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Context): Promise<Response> {
  return handleReviewRequest(request, (await params).id);
}

export async function PATCH(request: Request, { params }: Context): Promise<Response> {
  return handleReviewRequest(request, (await params).id);
}

export async function DELETE(request: Request, { params }: Context): Promise<Response> {
  return handleReviewRequest(request, (await params).id);
}
