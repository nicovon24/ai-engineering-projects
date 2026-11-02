// Explicitly invoked live smoke check. Only the authored synthetic fixture is sent.
import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { sources } from '../src/lib/fixture.ts';
import { chatTurn, advanceReview } from '../src/lib/server/workflow.ts';
import { completeJson } from '../src/lib/server/groq.ts';

process.loadEnvFile('.env.local');
const locale = process.argv[2] === 'en' ? 'en' : 'es';
const id = randomUUID();
const now = new Date().toISOString();
let review = {
  id, locale, createdAt: now, updatedAt: now, consentAt: now,
  proposal: { title: '', summary: '' }, messages: [], sources: [], stage: 'draft', stageOutputs: {},
};
const prompt = locale === 'es'
  ? 'Caso ficticio: propongo un piloto de seis semanas con cinco revisores para redactar respuestas de soporte interno con IA. Cada envío requiere aprobación humana. Excluimos datos sensibles. Tope de gasto: 500 unidades ficticias. Queremos decidir si aprobar, rechazar o posponer. Resume esto y pregunta qué información falta.'
  : 'Fictional case: I propose a six-week pilot with five reviewers using AI to draft internal help-desk answers. A human approves every outgoing answer. Sensitive data is excluded. Budget cap: 500 fictional units. We want to decide whether to approve, reject or defer. Summarize this and ask what is missing.';
const started = Date.now();
const observedOutputs = [];
let retryAfterMs = 60_000;
const model = async input => {
 for (let attempt = 0; attempt < 3; attempt++) {
  try {
   const output = await completeJson({ ...input, transport: async (...args) => {
    const response = await fetch(...args);
    if (!response.ok) {
     const body = await response.clone().json().catch(() => ({}));
     const waitMatch = typeof body.error?.message === 'string' ? body.error.message.match(/try again in ([\d.]+)s/i) : null;
     if (waitMatch) retryAfterMs = Math.min(120_000, Math.ceil(Number(waitMatch[1]) * 1000) + 2_000);
     const diagnostic = { status: response.status, model: process.env.GROQ_MODEL || 'openai/gpt-oss-20b', type: body.error?.type, code: body.error?.code, retryAfterMs: response.status === 429 ? retryAfterMs : undefined, message: body.error?.code === 'json_validate_failed' ? body.error?.message : undefined, failed_generation: body.error?.code === 'json_validate_failed' ? body.error?.failed_generation : undefined };
     await mkdir('.data/evals', { recursive: true });
     await writeFile(`.data/evals/provider-error-${locale}.json`, JSON.stringify(diagnostic, null, 2));
     console.log(JSON.stringify({ providerStatus: response.status, providerModel: diagnostic.model, providerErrorType: diagnostic.type, providerErrorCode: diagnostic.code, retryAfterMs: diagnostic.retryAfterMs, failedGenerationType: typeof diagnostic.failed_generation, failedGenerationLength: typeof diagnostic.failed_generation === 'string' ? diagnostic.failed_generation.length : undefined }));
    }
    return response;
   } });
   observedOutputs.push({ stage: review.stage, output });
   return output;
  } catch (error) {
   if (error.code !== 'provider_limited' || attempt === 2) throw error;
   console.log(JSON.stringify({ locale, stage: review.stage, retryingAfterMs: retryAfterMs }));
   await new Promise(resolve => setTimeout(resolve, retryAfterMs));
  }
 }
};
try {
  review = await chatTurn(review, prompt, model);
  review.sources = sources.map(source => ({
    id: source.id, reviewId: id, title: source.title[locale], format: 'text', passages: source.passages,
  }));
  console.log(JSON.stringify({ locale, stage: 'chat', messages: review.messages.length }));
  while (review.stage !== 'complete') {
    review = await advanceReview(review, model);
    console.log(JSON.stringify({ locale, stage: review.stage }));
  }
  await mkdir('.data/evals', { recursive: true });
  await writeFile(`.data/evals/live-${locale}.json`, JSON.stringify(review, null, 2));
  console.log(JSON.stringify({ locale, complete: true, claims: review.snapshot.claims.length, arguments: review.snapshot.arguments.length, questions: review.synthesis.questions.length, elapsedMs: Date.now() - started }));
} catch (error) {
  await mkdir('.data/evals', { recursive: true });
  await writeFile(`.data/evals/failure-${locale}.json`, JSON.stringify({ review, observedOutputs }, null, 2));
  console.log(JSON.stringify({ locale, complete: false, lastSavedStage: review.stage, error: error.code || error.name, elapsedMs: Date.now() - started }));
  process.exitCode = 1;
}
