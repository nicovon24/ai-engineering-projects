import { NextResponse } from 'next/server';
import { createRun, listRuns } from '../../../lib/research';

export const runtime = 'nodejs';
export async function GET() { return NextResponse.json({ runs: listRuns() }); }
export async function POST(request: Request) {
  let body: { question?: unknown; locale?: unknown; mode?: unknown };
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }
  if (typeof body.question !== 'string' || body.question.trim().length < 5 || body.question.length > 500 || !['es', 'en'].includes(String(body.locale)) || !['demo', 'live'].includes(String(body.mode))) return NextResponse.json({ error: 'Invalid research request' }, { status: 400 });
  const run = await createRun(body.question.trim(), body.locale as 'es' | 'en', body.mode as 'demo' | 'live');
  return NextResponse.json({ run }, { status: 201 });
}
