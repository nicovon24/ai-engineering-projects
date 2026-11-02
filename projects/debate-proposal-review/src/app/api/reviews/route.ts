import { handleReviewRequest } from "@/lib/server/service";

export const runtime = "nodejs";

export async function GET(request: Request): Promise<Response> {
  return handleReviewRequest(request);
}

export async function POST(request: Request): Promise<Response> {
  return handleReviewRequest(request);
}
