// Local deterministic provider for browser-to-disk integration checks only.
import http from 'node:http';
let failNext = false;
const server = http.createServer(async (request, response) => {
  if (request.url === '/control/fail-next') { failNext = true; response.end('ok'); return; }
  if (failNext) { failNext = false; response.writeHead(429, { 'Content-Type': 'application/json' }); response.end(JSON.stringify({ error: { code: 'synthetic_limit' } })); return; }
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  try {
    const body = JSON.parse(Buffer.concat(chunks).toString());
    const instruction = body.messages[0].content;
    const { locale, payload } = JSON.parse(body.messages[1].content);
    const es = locale === 'es';
    const budget = es ? 'El presupuesto aprobado es de 500 unidades.' : 'The approved budget is 500 units.';
    const uncertain = es ? 'El piloto garantiza un ahorro del 25%.' : 'The pilot guarantees a 25% saving.';
    const judgment = es ? 'Conviene comprobar los riesgos antes de ampliar el piloto.' : 'Risks should be checked before expanding the pilot.';
    let result;
    if (payload.messages) result = {
      message: es ? 'Podemos revisar este piloto. ¿Qué controles y criterios de éxito usarán?' : 'We can review this pilot. What controls and success criteria will you use?',
      proposal: { title: es ? 'Piloto de soporte' : 'Support pilot', summary: payload.messages.at(-1).content },
    };
    else if (payload.candidateIds) result = { verdicts: payload.claims.filter(claim => claim.kind === 'factual').map(claim => {
      const passageId = payload.candidateIds[claim.id]?.[0];
      const supported = claim.text === budget && passageId;
      return { claimId: claim.id, status: supported ? 'supported' : 'insufficient', supportingPassageIds: supported ? [passageId] : [], contradictingPassageIds: [], rationale: es ? (supported ? 'El pasaje indica el presupuesto aprobado.' : 'Los datos no garantizan un resultado futuro.') : (supported ? 'The passage states the approved budget.' : 'The data does not guarantee a future result.'), ...(supported ? {} : { noRelevantPassage: true }) };
    }) };
    else if (payload.verdicts) result = { summary: es ? 'El presupuesto está documentado; el ahorro sigue incierto.' : 'The budget is documented; savings remain uncertain.', questions: [{ question: es ? '¿Cuánto tiempo requiere la revisión humana?' : 'How much time does human review need?', neededEvidence: es ? 'Medir el tiempo de revisión durante el piloto.' : 'Measure review time during the pilot.' }] };
    else if (/supporting|opposing/.test(instruction)) result = { arguments: [{ text: es ? 'Un piloto acotado permite observar beneficios y riesgos.' : 'A bounded pilot allows benefits and risks to be observed.', claims: [{ text: /opposing/.test(instruction) ? judgment : budget, kind: /opposing/.test(instruction) ? 'value_judgment' : 'factual' }] }] };
    else result = { claims: [{ text: budget, kind: 'factual' }, { text: uncertain, kind: 'factual' }] };
    response.writeHead(200, { 'Content-Type': 'application/json' });
    response.end(JSON.stringify({ choices: [{ message: { content: JSON.stringify(result) } }] }));
  } catch {
    response.writeHead(400); response.end('Invalid synthetic request');
  }
});
server.listen(8767, '127.0.0.1', () => console.log('Synthetic provider: http://127.0.0.1:8767'));
