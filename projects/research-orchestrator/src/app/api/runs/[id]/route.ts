import { NextResponse } from 'next/server';
import { getRun, reviewRun } from '../../../../lib/research';

export const runtime = 'nodejs';
export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params; const run = getRun(id);
  return run ? NextResponse.json({ run }) : NextResponse.json({ error: 'Run not found' }, { status: 404 });
}
export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  let body: { action?: unknown; editedReport?: unknown; note?: unknown };
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }
  if (!['approve', 'revise'].includes(String(body.action)) || typeof body.editedReport !== 'string' || body.editedReport.trim().length < 10 || typeof body.note !== 'string') return NextResponse.json({ error: 'Invalid review' }, { status: 400 });
  const run = reviewRun(id, body.action as 'approve' | 'revise', body.editedReport.trim(), body.note.trim());
  return run ? NextResponse.json({ run }) : NextResponse.json({ error: 'Run unavailable' }, { status: 404 });
}
