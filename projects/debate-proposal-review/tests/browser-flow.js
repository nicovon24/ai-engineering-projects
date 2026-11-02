/* eslint-disable @typescript-eslint/no-unused-expressions */
async page => {
  const origin = 'http://127.0.0.1:3301';
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(origin);
  await page.getByRole('button', { name: 'ES', exact: true }).click();
  await page.getByRole('textbox', { name: 'Tu propuesta' }).waitFor();
  if (await page.getByText('Registro de afirmaciones').count()) throw new Error('Ledger leaked into chat home');
  await page.getByRole('checkbox', { name: /Autorizo/ }).waitFor();
  await page.getByRole('link', { name: 'Revisiones guardadas' }).click();
  await page.getByRole('heading', { name: 'Revisiones guardadas' }).waitFor();
  await page.setViewportSize({ width: 390, height: 844 });
  if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)) throw new Error('Mobile horizontal overflow');
  const reviewId = '48dac69b-f184-48d1-890b-45e69a78df13';
  let review = { id: reviewId, locale: 'es', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), proposal: { title: '', summary: '' }, messages: [], sources: [], stage: 'draft', stageOutputs: {} };
  const patches = [];
  let turns = 0;
  await page.route('**/api/reviews**', async route => {
    const request = route.request();
    const url = new URL(request.url());
    const parts = url.pathname.split('/').filter(Boolean);
    const body = request.postDataJSON?.() || {};
    if (request.method() === 'POST' && parts.length === 2) return route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ review }) });
    if (request.method() === 'GET' && parts.length === 3) return route.fulfill({ contentType: 'application/json', body: JSON.stringify({ review }) });
    if (request.method() === 'PATCH') {
      patches.push(body);
      review = { ...review, locale: body.locale || review.locale, consentAt: body.consent ? new Date().toISOString() : review.consentAt, proposal: body.proposal || review.proposal };
      return route.fulfill({ contentType: 'application/json', body: JSON.stringify({ review }) });
    }
    if (request.method() === 'POST' && parts.at(-1) === 'chat') {
      turns++;
      review = { ...review, messages: [...review.messages, { id: `u${turns}`, role: 'user', content: body.message }, { id: `a${turns}`, role: 'assistant', content: `Response ${turns}` }], proposal: { title: `Title ${turns}`, summary: `Summary ${turns}` } };
      return route.fulfill({ contentType: 'application/json', body: JSON.stringify({ review }) });
    }
    return route.fulfill({ status: 404, contentType: 'application/json', body: '{"error":"not_found"}' });
  });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(origin);
  await page.getByRole('button', { name: 'ES', exact: true }).click();
  await page.getByRole('checkbox', { name: /Autorizo/ }).check();
  await page.getByRole('textbox', { name: 'Tu propuesta' }).fill('First proposal');
  await page.getByRole('button', { name: 'Enviar mensaje' }).click();
  await page.waitForFunction(() => document.querySelector('#proposal-title')?.value === 'Title 1');
  await page.getByRole('button', { name: 'EN', exact: true }).click();
  await page.getByRole('textbox', { name: 'Your proposal' }).fill('Second proposal');
  await page.getByRole('button', { name: 'Send message' }).click();
  await page.waitForFunction(() => document.querySelector('#proposal-title')?.value === 'Title 2');
  if (patches.at(-1)?.locale !== 'en') throw new Error('Selected locale was not patched before second chat');
  await page.getByRole('link', { name: 'New review' }).click();
  if (await page.getByRole('textbox', { name: 'Proposal title' }).inputValue()) throw new Error('New review retained previous title');
  return 'chat/history desktop and mobile flow passed';
}
