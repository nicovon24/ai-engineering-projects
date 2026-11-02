// Explicit live provider check with a synthetic prompt and no user review data.
process.loadEnvFile('.env.local');

const apiKey = process.env.GROQ_API_KEY;
if (!apiKey) throw new Error('GROQ_API_KEY is not configured');
const baseUrl = (process.env.GROQ_BASE_URL || 'https://api.groq.com/openai/v1').replace(/\/+$/, '');
const model = process.argv[2] || 'openai/gpt-oss-120b';

function rateHeaders(response) {
  return {
    retryAfter: response.headers.get('retry-after'),
    remainingRequests: response.headers.get('x-ratelimit-remaining-requests'),
    remainingTokens: response.headers.get('x-ratelimit-remaining-tokens'),
    resetRequests: response.headers.get('x-ratelimit-reset-requests'),
    resetTokens: response.headers.get('x-ratelimit-reset-tokens'),
  };
}

try {
  const models = await fetch(`${baseUrl}/models`, {
    headers: { Authorization: `Bearer ${apiKey}` },
    signal: AbortSignal.timeout(20_000),
    cache: 'no-store',
  });
  const catalog = models.ok ? await models.json() : undefined;
  console.log(JSON.stringify({ endpoint: 'models', status: models.status, requestedModelAvailable: Boolean(catalog?.data?.some(item => item.id === model)), ...rateHeaders(models) }));
  if (!models.ok) process.exit(1);

  const completion = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      temperature: 0,
      reasoning_effort: 'low',
      max_completion_tokens: 128,
      response_format: {
        type: 'json_schema',
        json_schema: { name: 'health', strict: true, schema: { type: 'object', properties: { status: { type: 'string', enum: ['ok'] } }, required: ['status'], additionalProperties: false } },
      },
      messages: [
        { role: 'system', content: 'Return a JSON object with status ok.' },
        { role: 'user', content: 'Synthetic provider health check.' },
      ],
    }),
    signal: AbortSignal.timeout(20_000),
    cache: 'no-store',
  });
  const result = completion.ok ? await completion.json() : undefined;
  const valid = (() => { try { return JSON.parse(result?.choices?.[0]?.message?.content).status === 'ok'; } catch { return false; } })();
  console.log(JSON.stringify({ endpoint: 'chat/completions', model, status: completion.status, valid, usageTokens: result?.usage?.total_tokens, ...rateHeaders(completion) }));
  if (!completion.ok || !valid) process.exitCode = 1;
} catch (error) {
  console.log(JSON.stringify({ endpoint: 'network', error: error instanceof Error ? error.name : 'unknown' }));
  process.exitCode = 1;
}
